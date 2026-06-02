// ============================================================
//  NEXTEZ Newsroom - 뉴스 자동 수집 서버 함수 (Cloud Functions v2)
//  admin 페이지에서 호출 → 네이버 뉴스 검색 → 후보 목록 반환
// ============================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// 네이버 API 열쇠 (터미널에서 안전하게 등록 — 코드에 직접 안 적음)
const NAVER_CLIENT_ID = defineSecret("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = defineSecret("NAVER_CLIENT_SECRET");

// Daum 메일 계정 (사용 안 함 — Daum SMTP가 클라우드 발송 차단)
const DAUM_USER = defineSecret("DAUM_USER");
const DAUM_PASS = defineSecret("DAUM_PASS");

// Resend 메일 발송 API 키 (문의 메일 발송용)
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// ---- 도우미: HTML 태그/특수문자 제거 ----
function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ---- 도우미: 네이버 pubDate → 'YYYY.MM.DD' (한국시간 기준) ----
function pubDateToYmd(s) {
  try {
    const d = new Date(s);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(d);
    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    const da = parts.find(p => p.type === "day").value;
    return y + "." + m + "." + da;
  } catch (e) {
    return "";
  }
}

// ---- 도우미: URL → 도메인(언론사 추정) ----
function hostnameOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

// ============================================================
//  fetchNews : 네이버 뉴스 검색 후보 가져오기
//  - 호출: admin 페이지에서 로그인된 관리자만
//  - 입력: { keyword: "넥스트이지" }  (생략 시 기본값)
//  - 반환: { items: [ { title, url, date, outlet, desc }, ... ] }
// ============================================================
exports.fetchNews = onCall(
  {
    region: "asia-northeast3",
    secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET],
  },
  async (request) => {
    // 1) 로그인(관리자) 확인
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "관리자 로그인이 필요합니다.");
    }

    // 2) 검색어
    const keyword = (request.data && request.data.keyword
      ? String(request.data.keyword)
      : "넥스트이지").trim();

    // 3) 네이버 뉴스 검색 API 호출
    //    "큰따옴표"로 묶어 정확한 문구만 검색 (관련 없는 기사 줄이기) + 최신순 100건(최대치)
    const url =
      "https://openapi.naver.com/v1/search/news.json?query=" +
      encodeURIComponent('"' + keyword + '"') +
      "&display=100&sort=date";

    let json;
    try {
      const res = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID.value(),
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET.value(),
        },
      });
      if (!res.ok) {
        throw new HttpsError("internal", "네이버 API 오류 (" + res.status + ")");
      }
      json = await res.json();
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "뉴스 검색 실패: " + err.message);
    }

    // 4) 이미 등록된 기사(url) 목록 — 중복 제외용
    const existing = new Set();
    const snap = await admin.firestore().collection("news").get();
    snap.forEach(d => {
      const u = d.data().url;
      if (u) existing.add(u);
    });

    // 5) 결과 정리 + 관련성 필터 + 중복 제거
    const kwNorm = keyword.replace(/\s+/g, ""); // 공백 제거한 검색어
    const items = (json.items || [])
      .map(it => {
        const link = it.originallink || it.link || "";
        return {
          title: stripHtml(it.title),
          url: link,
          date: pubDateToYmd(it.pubDate),
          outlet: hostnameOf(link),
          desc: stripHtml(it.description),
        };
      })
      // 제목/요약에 검색어가 실제로 포함된 기사만 (무관한 기사 제거)
      .filter(it => (it.title + " " + it.desc).replace(/\s+/g, "").includes(kwNorm))
      // URL 없는 것 + 이미 등록된 것 제거
      .filter(it => it.url && !existing.has(it.url));

    return { items, keyword };
  }
);

// ============================================================
//  sendInquiry : 홈페이지 문의 폼 → nextez@daum.net 으로 메일 발송
//  - 누구나(방문자) 호출 가능 (로그인 불필요)
//  - 입력: { name, org, email, phone, message }
// ============================================================
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

exports.sendInquiry = onCall(
  {
    region: "asia-northeast3",
    secrets: [RESEND_API_KEY],
  },
  async (request) => {
    const d = request.data || {};
    const name = String(d.name || "").trim();
    const org = String(d.org || "").trim();
    const email = String(d.email || "").trim();
    const phone = String(d.phone || "").trim();
    const message = String(d.message || "").trim();

    // 필수값 + 기본 스팸 방지
    if (!name || !email || !message) {
      throw new HttpsError("invalid-argument", "이름·이메일·문의내용은 필수입니다.");
    }
    if (message.length > 5000 || name.length > 100) {
      throw new HttpsError("invalid-argument", "입력 길이가 너무 깁니다.");
    }

    const html =
      '<div style="font-family:sans-serif;font-size:14px;line-height:1.7;color:#222">' +
      '<h2 style="color:#ff6600;margin:0 0 12px">홈페이지 문의가 도착했습니다</h2>' +
      '<table style="border-collapse:collapse;width:100%;max-width:600px">' +
      '<tr><td style="padding:6px 10px;background:#f5f5f5;width:120px"><b>이름</b></td><td style="padding:6px 10px">' + escapeHtml(name) + '</td></tr>' +
      '<tr><td style="padding:6px 10px;background:#f5f5f5"><b>소속·직책</b></td><td style="padding:6px 10px">' + escapeHtml(org || "-") + '</td></tr>' +
      '<tr><td style="padding:6px 10px;background:#f5f5f5"><b>이메일</b></td><td style="padding:6px 10px">' + escapeHtml(email) + '</td></tr>' +
      '<tr><td style="padding:6px 10px;background:#f5f5f5"><b>연락처</b></td><td style="padding:6px 10px">' + escapeHtml(phone || "-") + '</td></tr>' +
      '<tr><td style="padding:6px 10px;background:#f5f5f5;vertical-align:top"><b>문의 내용</b></td><td style="padding:6px 10px;white-space:pre-wrap">' + escapeHtml(message) + '</td></tr>' +
      '</table></div>';

    // Resend API로 메일 발송 (Daum 수신함으로 도착)
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + RESEND_API_KEY.value(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "NEXTEZ 홈페이지 문의 <onboarding@resend.dev>",
          to: ["nextez@daum.net"],
          reply_to: email,
          subject: "[홈페이지 문의] " + name + (org ? " / " + org : ""),
          html: html,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error("Resend 발송 실패:", res.status, detail);
        throw new HttpsError("internal", "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("메일 발송 오류:", err);
      throw new HttpsError("internal", "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }

    return { ok: true };
  }
);

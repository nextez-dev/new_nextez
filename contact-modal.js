// ============================================================
//  문의하기 모달 (공통)
//  - 편지(mail) 버튼 클릭 → 문의 입력폼 표시
//  - news / services / capabilities 페이지에서 공통 사용
//  ※ 메일 발송 기능은 다음 단계에서 연결 (지금은 화면 + 입력검증까지)
// ============================================================
(function () {
  if (window.__contactModalLoaded) return;
  window.__contactModalLoaded = true;

  // ---- 스타일 (입력칸: 흰 배경 + 검정 글자) ----
  var style = document.createElement('style');
  style.textContent =
    '.cf-input{width:100%;background:#fff;border:1px solid rgba(0,0,0,0.15);border-radius:.5rem;padding:9px 12px;color:#111;font-size:14px;}' +
    '.cf-input::placeholder{color:#9a9a9a;}' +
    '.cf-input:focus{outline:none;border-color:#ff6600;box-shadow:0 0 0 2px rgba(255,102,0,.2);}' +
    '#contact-overlay{font-family:"Pretendard Variable",Pretendard,sans-serif;}';
  document.head.appendChild(style);

  // ---- 모달 HTML ----
  var html =
  '<div id="contact-overlay" class="hidden fixed inset-0 z-[100] items-center justify-center bg-black/60 backdrop-blur-sm p-4">' +
    '<div class="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">' +
      '<div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">' +
        '<h3 class="text-lg font-bold text-white flex items-center gap-2"><span class="material-symbols-outlined text-[#ff6600]">mail</span>문의하기</h3>' +
        '<button id="contact-close" type="button" class="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<form id="contact-form" class="px-6 py-5 space-y-3">' +
        '<p class="text-sm text-gray-400 mb-1">아래 내용을 남겨주시면 빠르게 연락드리겠습니다.</p>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
          '<div><label class="block text-xs text-gray-400 mb-1">이름 <span class="text-[#ff6600]">*</span></label>' +
            '<input id="c-name" type="text" required class="cf-input" placeholder="홍길동"></div>' +
          '<div><label class="block text-xs text-gray-400 mb-1">소속 및 직책</label>' +
            '<input id="c-org" type="text" class="cf-input" placeholder="㈜○○○ / 팀장"></div>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
          '<div><label class="block text-xs text-gray-400 mb-1">이메일 주소 <span class="text-[#ff6600]">*</span></label>' +
            '<input id="c-email" type="email" required class="cf-input" placeholder="name@example.com"></div>' +
          '<div><label class="block text-xs text-gray-400 mb-1">연락처(핸드폰)</label>' +
            '<input id="c-phone" type="tel" class="cf-input" placeholder="010-0000-0000"></div>' +
        '</div>' +
        '<div><label class="block text-xs text-gray-400 mb-1">문의 내용 <span class="text-[#ff6600]">*</span></label>' +
          '<textarea id="c-message" required rows="5" class="cf-input resize-none" placeholder="문의하실 내용을 입력해주세요."></textarea></div>' +
        '<div class="flex items-center gap-3 pt-1">' +
          '<button type="submit" id="contact-submit" class="bg-[#ff6600] text-black font-bold rounded-lg px-6 py-2.5 hover:brightness-110 transition">보내기</button>' +
          '<button type="button" id="contact-cancel" class="text-sm text-gray-400 hover:text-white">취소</button>' +
          '<span id="contact-msg" class="text-sm"></span>' +
        '</div>' +
      '</form>' +
    '</div>' +
  '</div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  var overlay = document.getElementById('contact-overlay');
  var form = document.getElementById('contact-form');
  var msg = document.getElementById('contact-msg');

  function openModal() {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var n = document.getElementById('c-name'); if (n) n.focus(); }, 60);
  }
  function closeModal() {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.body.style.overflow = '';
  }

  // ---- 편지(mail) 버튼에 연결 ----
  Array.prototype.forEach.call(document.querySelectorAll('a, button'), function (el) {
    var icon = el.querySelector('.material-symbols-outlined');
    if (icon && icon.textContent.trim() === 'mail') {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    }
  });

  // ---- 닫기 ----
  document.getElementById('contact-close').addEventListener('click', closeModal);
  document.getElementById('contact-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal(); });

  // ---- 제출 → 서버 함수(sendInquiry)로 메일 발송 ----
  var submitBtn = document.getElementById('contact-submit');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var data = {
      name: v('c-name'), org: v('c-org'),
      email: v('c-email'), phone: v('c-phone'),
      message: v('c-message')
    };
    submitBtn.disabled = true;
    var oldText = submitBtn.textContent;
    submitBtn.textContent = '전송 중...';
    msg.className = 'text-sm text-gray-400 pt-1';
    msg.textContent = '';
    try {
      var initMod = await import('/firebase-init.js');
      var fnMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js');
      var sendInquiry = fnMod.httpsCallable(initMod.functions, 'sendInquiry');
      await sendInquiry(data);
      msg.className = 'text-sm text-[#ffb596] pt-1';
      msg.textContent = '문의가 정상적으로 접수되었습니다. 감사합니다! ✓';
      form.reset();
    } catch (err) {
      console.error(err);
      msg.className = 'text-sm text-red-400 pt-1';
      msg.textContent = '전송 실패: ' + (err && err.message ? err.message : '잠시 후 다시 시도해주세요.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  });

  function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
})();

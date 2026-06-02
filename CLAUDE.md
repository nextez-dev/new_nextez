# ㈜넥스트이지(NEXTEZ) 홈페이지 — 작업 규칙

> 본 파일은 모든 작업 시 자동 적용되는 표준이다. 새 페이지/수정 작업 시 묻지 말고 따른다.
> ※ 이 프로젝트는 제주 포트홀 제안서 프로젝트와 **무관**하다. 포트홀의 디자인 규칙(A4 인쇄용, 외부 design-system.css, `<style>` 금지 등)을 이 프로젝트에 적용하지 않는다.

---

## 1. 프로젝트 개요

- **대상**: ㈜넥스트이지 2026 기업 홈페이지 (정적 다중 HTML 사이트)
- **회사 한 줄 정의**: "산업 현장의 데이터로 AI를 만들고, 그 AI로 산업을 다시 만드는 회사" (25년차, 제주 소재)
- **언어**: 한국어 (`<html lang="ko">`)
- **페이지 구성**: `index.html`(메인) · `about.html` · `services.html` · `capabilities.html` · `portfolio.html` · `news.html`
  - `index-old.html`은 구버전 백업 — 수정하지 않는다
  - `portfolio.html`은 `portfolio-data.js`의 데이터를 사용한다

---

## 2. 콘텐츠 사실 근거 (★ 가장 중요)

- **모든 홈페이지 텍스트의 사실 근거는 `_brief/` 폴더다.**
  - `_brief/00-company-profile.md` — 회사 정체성 마스터 문서 (수치·연혁·도메인·역량의 단일 기준)
  - `_brief/content/*.md` — 페이지·섹션별 콘텐츠 원문 (about-*, services-*, capabilities-*)
- 새 콘텐츠를 쓰거나 수치를 넣을 때는 **반드시 `_brief`를 먼저 확인**하고 그 사실에 맞춘다.
- `_brief`에 없는 수치·실적·고객사명을 임의로 지어내지 않는다. 불확실하면 사용자에게 확인한다.
- 핵심 자산 키워드(예시): jeju114·섬프로·탐라이브·PhotoBee(관광), 제주DA·JADX·병해충 식별 12종·태양광 예측 95%(농업/에너지), GS인증 10건·특허 출원18/등록3·정부R&D 16건+.

---

## 3. 4대 도메인 · 4대 역량 (분류 일관성)

- **4대 도메인(Services)**: Tourism · Agriculture · Energy · Smart City
- **4대 역량(Capabilities)**: AI Solutions · DX·AX Consulting · Data & Platform · Domain SI & R&D
- 4분류를 나열할 때는 위 순서를 유지한다.

---

## 4. 디자인 시스템 (실제 코드 기준 — 변경 금지)

기술 스택은 각 HTML 내부에 인라인으로 정의된다. **별도 외부 CSS 파일을 만들지 않는다** (현 구조 유지).

### 4-1. 스택
- **Tailwind CSS** (CDN: `https://cdn.tailwindcss.com?plugins=forms,container-queries`)
- 페이지별 `<script id="tailwind-config">`에서 `tailwind.config`를 인라인 정의
- 페이지 고유 애니메이션/특수 스타일은 `<head>` 내 `<style>` 블록 허용 (이 프로젝트는 인라인 허용)

### 4-2. 컬러 토큰 (Material 3 스타일 · 다크 테마)
- 기본 테마: **다크** (`<html class="dark">`, `background #131313`, `color #e5e2e1`)
- **Primary(브랜드) = 오렌지** `#ff6600` (primary-container) / `primary #ffb596` / `on-primary #581e00`
- 신규 페이지는 기존 페이지의 `tailwind.config` colors 블록을 복제해 동일 토큰을 쓴다. 색을 임의로 바꾸지 않는다.

### 4-3. 폰트
- 본문: **Pretendard Variable** → Pretendard → sans-serif
  (`https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/...`)
- 타입 스케일: `headline-xl`(48/700) · `headline-lg`(32/600) · `body-md`(16/400) · `label-bold`(12/700)

### 4-4. 아이콘
- **Material Symbols Outlined** (Google Fonts) 사용
- 외부 이미지는 `IMG/` 폴더의 자산 활용

---

## 5. 신규 페이지/수정 워크플로우

1. 작업 전 **가장 가까운 기존 페이지를 먼저 Read** 하여 구조·tailwind config·컬러 토큰을 그대로 복제한다 (`index.html` 또는 동류 페이지).
2. 콘텐츠는 §2의 `_brief`를 근거로 작성한다.
3. 컬러/폰트/타입스케일은 §4 토큰을 재사용한다 (새 토큰 임의 추가 금지).
4. 4분류는 §3 순서를 따른다.
5. `index-old.html`·`portfolio-data.js` 데이터 구조는 함부로 바꾸지 않는다.

---

## 6. 작업 폴더 안전 (★)

- 이 폴더는 **Google Drive 동기화 경로가 아닌 로컬(E:)** 이지만, 독립 git 저장소다.
- 의미 있는 변경 후에는 사용자 요청 시 커밋한다. 커밋/푸시는 사용자가 요청할 때만 수행한다.

---

## 7. ❌ 하지 말 것
- ❌ 포트홀 제안서 디자인 규칙(외부 design-system.css, A4 인쇄 레이아웃, cat1~4 4색 등) 적용
- ❌ `_brief`에 없는 수치·실적·고객사 임의 생성
- ❌ 오렌지(#ff6600) 외 브랜드 컬러 임의 변경
- ❌ `index-old.html` 수정
- ❌ Pretendard 외 본문 폰트 사용

---

## 8. 메타
- 본 파일은 사용자 요청 없이는 변경하지 않는다.
- 새 표준 합의 시 본 파일을 갱신한다.
- 생성일: 2026.06.02

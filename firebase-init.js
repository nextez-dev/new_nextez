// ============================================================
//  Firebase 연결 설정 (공통)
//  - admin.html 과 news.html 이 이 파일을 함께 사용합니다.
//  - apiKey 는 비밀번호가 아니라 공개돼도 되는 값입니다.
//    (실제 보안은 Firestore "규칙"이 담당)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRbVj1Tj_4FdcFfl7HFbDXdzGadOhru4w",
  authDomain: "nextez-news.firebaseapp.com",
  projectId: "nextez-news",
  storageBucket: "nextez-news.firebasestorage.app",
  messagingSenderId: "979273321825",
  appId: "1:979273321825:web:eccabb87c79e5d61aa0920"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

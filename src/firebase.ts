// src/firebase.ts

// 필요한 Firebase SDK 함수들을 가져옵니다.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // 애널리틱스는 필요시 주석을 해제하여 사용합니다.

/**
 * Firebase 설정 객체입니다.
 * 
 * 보안상 실제 프로덕션 환경에서는 이 값들을 직접 코드에 넣기보다,
 * .env 파일을 만들어 환경 변수로 관리하는 것이 좋습니다.
 * 
 * 예: VITE_API_KEY = "your-api-key"
 * 코드에서 접근: import.meta.env.VITE_API_KEY
 */
const firebaseConfig = {
  apiKey: "AIzaSyCBHxyTegItPlckKyvDZa1aE0ee8xrTWIQ",
  authDomain: "sayko-f08c1.firebaseapp.com",
  projectId: "sayko-f08c1",
  storageBucket: "sayko-f08c1.appspot.com",
  messagingSenderId: "692967753737",
  appId: "1:692967753737:web:e0f4962c640e79e6079c67"
};

// Firebase 앱을 초기화합니다.
const app = initializeApp(firebaseConfig);

// 다른 파일에서 Firebase 서비스를 쉽게 사용할 수 있도록 초기화된 인스턴스를 내보냅니다.
export const auth = getAuth(app); // 인증 서비스
export const db = getFirestore(app); // Firestore 데이터베이스 서비스
// const analytics = getAnalytics(app); // 애널리틱스 서비스 
/**
 * 'vocabularies' 컬렉션에서 변환된, 앱 전체에서 사용될 표준 단어 객체 구조입니다.
 */
export interface Vocabulary {
  id: string;
  kor: string; // 한국어 단어 (Firestore의 'word' 필드에서 매핑됨)
  eng: string; // 영어 번역 (Firestore의 'meaning' 객체 또는 문자열에서 매핑됨)
  priority: number; // 학습 우선순위
  pronunciation?: string; // 발음
  category?: string; // 카테고리
  examples: Example[]; // 예문 배열 (Firestore의 'examples' 또는 'sentences'에서 매핑됨)
  imageUrl?: string; // 선택적 속성으로 imageUrl 추가
  meaning: string; // 의미 필드 추가
}

/**
 * Vocabulary 객체 내의 예문 구조입니다.
 */
export interface Example {
  kor: string; // 한국어 예문
  eng: string; // 영어 예문
}

/**
 * 'users' 컬렉션의 문서 구조를 정의합니다.
 * 문서 ID는 Firebase Authentication의 UID를 사용합니다.
 */
export interface User {
  uid: string; // Firebase Auth UID
  email: string | null;
  displayName: string | null;
  currentCycle?: number; // 현재 학습 사이클
  currentDay?: number; // 현재 학습일
  languageSettings?: {
    primary: 'kor' | 'eng' | 'ger';
    secondary: 'kor' | 'eng' | 'ger';
  };
  testHistory?: string[]; // 'testResults' 문서 ID 참조 배열
  createdAt?: Timestamp; // 계정 생성 시간
  id: string; // 문서 ID
  userId: string; // 'users' 문서 ID (UID) 참조
  cycle: number; // 시험 본 시점의 사이클
  day: number;
}

/**
 * 'testResults' 컬렉션의 문서 구조를 정의합니다.
 */
export interface TestResult {
  id: string; // 문서 ID
  userId: string; // 'users' 문서 ID (UID) 참조
  cycle: number; // 시험 본 시점의 사이클
  day: number;
  results: {
    wordId: string;
    kor: string;
    eng: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  score: number;
  createdAt: Date;
  stageAdvanced?: boolean;
} 
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User, TestResult } from '../types/firestore';
import type { User as AuthUser } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';
import { getVocabularies, CYCLE_CONFIG } from './vocabularyService';
import type { Vocabulary } from '../types/firestore';

/**
 * Firestore에서 사용자 데이터를 가져오거나, 없는 경우 새로 생성합니다.
 * @param user - Firebase Auth에서 제공하는 사용자 객체
 * @returns {Promise<User>} Firestore에 저장된 사용자 데이터
 */
export const getUserData = async (user: AuthUser): Promise<User> => {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    // 문서가 존재하면 해당 데이터를 User 타입으로 변환하여 반환
    return { id: docSnap.id, ...docSnap.data() } as User;
  } else {
    // 문서가 없으면 새로운 사용자 데이터를 생성하여 저장
    const newUser: Omit<User, 'id'> = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      currentCycle: 1,
      currentDay: 1,
      createdAt: serverTimestamp() as any, // setDoc에서는 FieldValue를 직접 사용
      // User 타입에 맞게 필드 추가
      userId: user.uid,
      cycle: 1, 
      day: 1,
    };
    await setDoc(userRef, newUser);
    return { id: user.uid, ...newUser } as User;
  }
};

/**
 * Firestore에 있는 사용자의 데이터를 업데이트합니다.
 * @param uid - 업데이트할 사용자의 UID
 * @param data - 업데이트할 데이터 객체
 * @returns {Promise<void>}
 */
export const updateUserData = async (uid: string, data: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true }); // merge: true로 기존 데이터를 보존합니다.
};

/**
 * 특정 사용자의 모든 시험 결과를 Firestore에서 가져옵니다.
 * @param uid - 사용자 UID
 * @returns {Promise<TestResult[]>} 시험 결과 배열
 */
export const getTestResultsForUser = async (uid: string): Promise<TestResult[]> => {
  const testResultsRef = collection(db, 'users', uid, 'testResults');
  const q = query(testResultsRef);
  const querySnapshot = await getDocs(q);
  
  const results = querySnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TestResult))
    .filter(result => result.createdAt && typeof result.createdAt.toDate === 'function');

  return results;
};

/**
 * 사용자가 학습한 총 단어 수를 계산합니다.
 * @param dbUser - Firestore의 사용자 데이터 객체
 * @returns {Promise<{learnedWords: number, totalWords: number}>} 학습한 단어 수와 총 단어 수
 */
export const calculateLearnedWords = async (dbUser: User): Promise<{learnedWords: number, totalWords: number}> => {
  const totalWords = (await getVocabularies()).length;
  if (totalWords === 0) {
    return { learnedWords: 0, totalWords: 0 };
  }

  let learnedWords = 0;
  const currentCycle = dbUser.currentCycle || 1;
  const currentDay = dbUser.currentDay || 1;

  // 지난 사이클에서 학습한 단어 수
  for (let i = 1; i < currentCycle; i++) {
    const cycleConfig = CYCLE_CONFIG[i];
    if (cycleConfig) {
      learnedWords += cycleConfig.wordsPerDay * cycleConfig.duration;
    }
  }
  
  // 현재 사이클에서 (어제까지) 학습한 단어 수
  const currentCycleConfig = CYCLE_CONFIG[currentCycle];
  if (currentCycleConfig) {
    learnedWords += currentCycleConfig.wordsPerDay * (currentDay - 1);
  }

  return { learnedWords, totalWords };
};

/**
 * 사용자가 틀린 모든 단어를 중복 없이 가져옵니다.
 * @param uid - 사용자 UID
 * @returns {Promise<Vocabulary[]>} 틀린 단어 객체 배열
 */
export const getIncorrectWords = async (uid: string): Promise<Vocabulary[]> => {
  // 1. 사용자의 모든 시험 결과를 가져옵니다.
  const testResults = await getTestResultsForUser(uid);

  // 2. 틀린 단어의 ID만 중복 없이 Set에 저장합니다.
  const incorrectWordIds = new Set<string>();
  testResults.forEach(result => {
    result.results.forEach(answer => {
      if (!answer.isCorrect) {
        incorrectWordIds.add(answer.wordId);
      }
    });
  });

  if (incorrectWordIds.size === 0) {
    return [];
  }

  // 3. 전체 단어 목록을 가져옵니다.
  const allWords = await getVocabularies();

  // 4. 틀린 단어 ID에 해당하는 단어 객체만 필터링하여 반환합니다.
  const incorrectWords = allWords.filter(word => incorrectWordIds.has(word.id));
  
  return incorrectWords;
}; 
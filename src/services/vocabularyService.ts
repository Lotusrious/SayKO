import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Vocabulary, Example, TestResult } from '../types/firestore';

/**
 * Firestore의 'vocabularies' 컬렉션에서 모든 단어 목록을 가져와
 * 앱에서 사용하기 위한 표준 Vocabulary 객체 배열로 변환합니다.
 * 학습 우선순위(priority)가 낮은 순서대로 정렬하여 반환합니다.
 * 
 * @returns {Promise<Vocabulary[]>} 정렬 및 변환된 단어 객체 배열을 반환하는 프로미스.
 * @throws {Error} 데이터 조회 또는 변환 중 에러 발생 시 에러를 던집니다.
 */
export const getVocabularies = async (): Promise<Vocabulary[]> => {
  const vocabularies: Vocabulary[] = [];
  const q = query(collection(db, 'vocabularies'), orderBy('priority', 'asc'));

  try {
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      let engMeaning: string = '';

      if (typeof data.meaning === 'object' && data.meaning !== null && data.meaning.eng) {
        engMeaning = data.meaning.eng;
      } else if (typeof data.meaning === 'string') {
        engMeaning = data.meaning;
      } else if (typeof data.meaning === 'object' && data.meaning !== null) {
        engMeaning = data.meaning.en || '';
      }

      const rawExamples = data.examples || data.sentences || [];
      const examples: Example[] = rawExamples
        .map((ex: any) => ({
          kor: ex.kor || ex.sentence_ko || '',
          eng: ex.eng || ex.sentence_en || '',
        }))
        .filter((ex: Example) => ex.kor);

      const vocabulary: Vocabulary = {
        id: doc.id,
        kor: data.word || '',
        eng: engMeaning,
        priority: data.priority ?? 99,
        pronunciation: data.pronunciation || '',
        category: data.category || '',
        meaning: data.meaning || '',
        examples: examples,
      };
      
      vocabularies.push(vocabulary);
    });

    return vocabularies;
  } catch (error) {
    console.error('Error fetching vocabularies: ', error);
    throw new Error('Failed to fetch and transform vocabularies from Firestore.');
  }
};

/**
 * 시험 결과를 Firestore에 저장합니다.
 * 'users/{userId}/testResults' 경로에 저장됩니다.
 * @param userId - 시험을 본 사용자의 ID
 * @param resultData - 저장할 시험 결과 데이터
 * @returns {Promise<string>} 저장된 문서의 ID
 */
export const saveTestResult = async (
  userId: string,
  resultData: Omit<TestResult, 'id' | 'createdAt'>
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required to save test results.');
  }
  try {
    const docRef = await addDoc(
      collection(db, 'users', userId, 'testResults'),
      {
        ...resultData,
        createdAt: serverTimestamp(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Error saving test result: ', error);
    throw new Error('Failed to save test result.');
  }
};

/**
 * 특정 사용자의 모든 시험 결과를 Firestore에서 가져옵니다.
 * @param userId - 조회할 사용자의 ID
 * @returns {Promise<TestResult[]>} 해당 사용자의 모든 시험 결과 배열
 */
export const getTestResultsForUser = async (userId: string): Promise<TestResult[]> => {
  if (!userId) {
    throw new Error('User ID is required to fetch test results.');
  }
  try {
    const results: TestResult[] = [];
    const q = query(
      collection(db, 'users', userId, 'testResults'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        results: data.results,
        score: data.score,
        createdAt: data.createdAt.toDate(),
        cycle: data.cycle,
        day: data.day,
        stageAdvanced: data.stageAdvanced,
        isFreeTest: data.isFreeTest,
      });
    });
    return results;
  } catch (error) {
    console.error('Error fetching test results for user: ', error);
    throw new Error('Failed to fetch test results.');
  }
};

/**
 * ID를 사용하여 특정 시험 결과를 가져옵니다.
 * @param userId - 사용자의 ID
 * @param resultId - 시험 결과 문서의 ID
 * @returns {Promise<TestResult | null>} 시험 결과 데이터 또는 null
 */
export const getTestResultById = async (userId: string, resultId: string): Promise<TestResult | null> => {
  if (!userId || !resultId) {
    throw new Error('User ID and Result ID are required.');
  }
  try {
    const docRef = doc(db, 'users', userId, 'testResults', resultId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        results: data.results,
        score: data.score,
        createdAt: data.createdAt.toDate(),
        cycle: data.cycle,
        day: data.day,
        stageAdvanced: data.stageAdvanced,
        isFreeTest: data.isFreeTest,
      };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching test result by ID: ", error);
    throw new Error("Failed to fetch test result by ID.");
  }
};

// 새로운 사이클 설정
export const CYCLE_CONFIG: { [key: number]: { wordsPerDay: number; duration: number; } } = {
  1: { wordsPerDay: 25, duration: 20 },
  2: { wordsPerDay: 50, duration: 10 },
  3: { wordsPerDay: 100, duration: 5 },
  4: { wordsPerDay: 250, duration: 2 },
  5: { wordsPerDay: 500, duration: 1 },
};

/**
 * 특정 사이클과 학습일에 해당하는 단어 목록을 가져옵니다.
 * @param cycle - 현재 사이클 (1-5)
 * @param day - 현재 학습일 (1-indexed)
 * @returns 해당 날짜에 학습할 단어 배열
 */
export const getWordsForDay = async (cycle: number, day: number): Promise<Vocabulary[]> => {
  const allWords = await getVocabularies(); // 모든 단어를 우선순위에 따라 정렬하여 가져옴

  const config = CYCLE_CONFIG[cycle] || CYCLE_CONFIG[1]; // 유효하지 않은 사이클일 경우 기본값 사용
  const wordsPerDay = config.wordsPerDay;
  
  const startIndex = (day - 1) * wordsPerDay;
  const endIndex = startIndex + wordsPerDay;

  // 전체 단어 목록 내에서 해당 부분을 잘라 반환합니다.
  return allWords.slice(startIndex, endIndex);
}; 
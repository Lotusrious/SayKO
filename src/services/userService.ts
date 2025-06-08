import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User, TestResult } from '../types/firestore';
import type { User as AuthUser } from 'firebase/auth';
import { collection, query, getDocs, where } from 'firebase/firestore';

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
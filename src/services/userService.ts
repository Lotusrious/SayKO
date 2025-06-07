import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types/firestore';
import type { User as AuthUser } from 'firebase/auth';

/**
 * Firestore에서 특정 사용자의 데이터를 가져옵니다.
 * 문서가 존재하지 않으면, 새로운 사용자 문서를 생성합니다.
 * @param user - Firebase Auth에서 제공하는 사용자 객체
 * @returns {Promise<User>} Firestore에 저장된 사용자 데이터
 */
export const getUserData = async (user: AuthUser): Promise<User> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // 문서가 존재하면 해당 데이터를 반환합니다.
    return userSnap.data() as User;
  } else {
    // 문서가 존재하지 않으면 새로운 사용자 데이터를 생성하고 저장합니다.
    const newUser: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      currentCycle: 1,
      currentDay: 1,
      createdAt: serverTimestamp(), // 생성 시점의 서버 타임스탬프 기록
    };
    await setDoc(userRef, newUser);
    return newUser;
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
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

// Context에 담길 데이터의 타입을 정의합니다.
interface AuthContextType {
  currentUser: User | null; // 현재 로그인된 사용자 정보 (User 객체 또는 null)
  loading: boolean; // 로딩 상태
}

// 1. 인증 컨텍스트(Auth Context)를 생성합니다.
// 앱의 다른 컴포넌트들이 이 컨텍스트를 통해 currentUser와 loading 값에 접근할 수 있습니다.
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

/**
 * 다른 컴포넌트에서 쉽게 AuthContext를 사용할 수 있도록 하는 커스텀 훅(hook)입니다.
 * 예: const { currentUser } = useAuth();
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider 컴포넌트가 받을 props의 타입을 정의합니다.
// children은 React 컴포넌트가 될 수 있음을 의미합니다.
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 2. 인증 프로바이더(Auth Provider) 컴포넌트입니다.
 * 이 컴포넌트는 자식 컴포넌트(children)에게 인증 상태(로그인한 유저 정보)를 제공합니다.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 앱 시작 시 인증 상태 확인 중임을 나타냄

  // 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.
  useEffect(() => {
    // onAuthStateChanged: Firebase Auth의 로그인 상태 변경을 감지하는 리스너(listener)입니다.
    // 사용자가 로그인하거나 로그아웃할 때마다 이 함수가 호출됩니다.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // 감지된 사용자 정보로 state 업데이트
      setLoading(false); // 로딩 상태 종료
    });

    // 컴포넌트가 언마운트될 때 리스너를 정리(cleanup)합니다.
    // 이렇게 하지 않으면 메모리 누수가 발생할 수 있습니다.
    return unsubscribe;
  }, []); // 빈 배열을 전달하여 최초 렌더링 시에만 실행되도록 함

  // 컨텍스트에 담을 값
  const value = {
    currentUser,
    loading,
  };

  // AuthContext.Provider를 통해 value를 하위 컴포넌트들에게 전달합니다.
  // 로딩 중이 아닐 때만 자식 컴포넌트들을 렌더링합니다.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 보호된 라우트 컴포넌트
 *
 * 이 컴포넌트는 자식 컴포넌트(children)를 감싸서,
 * 로그인된 사용자만 해당 자식 컴포넌트에 접근할 수 있도록 보호합니다.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser } = useAuth();

  // 만약 로그인한 사용자가 없다면,
  if (!currentUser) {
    // '/login' 경로로 리디렉션합니다.
    // Navigate 컴포넌트는 렌더링될 때 지정된 경로로 페이지를 이동시킵니다.
    return <Navigate to="/login" />;
  }

  // 로그인한 사용자가 있다면, 자식 컴포넌트를 그대로 렌더링합니다.
  return children;
};

export default ProtectedRoute; 
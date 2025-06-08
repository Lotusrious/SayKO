import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 보호된 라우트 컴포넌트
 *
 * 이 컴포넌트는 중첩된 라우트(Outlet)를 감싸서,
 * 로그인된 사용자만 해당 라우트들에 접근할 수 있도록 보호합니다.
 */
interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // 사용자가 로그인하지 않았으면 로그인 페이지로 리디렉션합니다.
    return <Navigate to="/login" replace />;
  }

  // 사용자가 로그인했으면 요청된 자식 컴포넌트를 렌더링합니다.
  return children;
};

export default PrivateRoute; 
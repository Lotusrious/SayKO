import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 보호된 라우트 컴포넌트
 *
 * 이 컴포넌트는 중첩된 라우트(Outlet)를 감싸서,
 * 로그인된 사용자만 해당 라우트들에 접근할 수 있도록 보호합니다.
 */
const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  // 만약 로그인한 사용자가 없다면, '/login' 경로로 리디렉션합니다.
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 로그인한 사용자가 있다면, 중첩된 자식 라우트를 렌더링합니다.
  return <Outlet />;
};

export default ProtectedRoute; 
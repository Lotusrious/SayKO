import { useAuth } from '../contexts/AuthContext';

/**
 * 간단한 마이페이지 컴포넌트
 */
const MyPage = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <h2>마이페이지</h2>
      {currentUser ? (
        <p>환영합니다, {currentUser.email} 님!</p>
      ) : (
        <p>사용자 정보를 불러오는 중...</p>
      )}
    </div>
  );
};

export default MyPage; 
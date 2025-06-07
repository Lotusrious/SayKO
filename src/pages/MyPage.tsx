import { useAuth } from '../contexts/AuthContext';

/**
 * 간단한 마이페이지 컴포넌트
 */
const MyPage = () => {
  const { currentUser, dbUser, loading } = useAuth();

  if (loading) {
    return <p>사용자 정보를 불러오는 중...</p>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      {currentUser && dbUser ? (
        <div className="space-y-2">
          <p><strong>이메일:</strong> {currentUser.email}</p>
          <p><strong>이름:</strong> {currentUser.displayName || '정보 없음'}</p>
          <hr className="my-4" />
          <h3 className="text-xl font-semibold">학습 현황</h3>
          <p><strong>현재 학습 사이클:</strong> {dbUser.currentCycle || 1} 주기</p>
          <p><strong>현재 학습일:</strong> {dbUser.currentDay || 1} 일차</p>
        </div>
      ) : (
        <p>사용자 정보를 표시할 수 없습니다.</p>
      )}
    </div>
  );
};

export default MyPage; 
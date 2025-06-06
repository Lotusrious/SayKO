import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { auth } from './firebase';

function App() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">Home</Link>
            </div>
            <div className="flex items-center">
              {currentUser ? (
                <>
                  <Link to="/mypage" className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">마이페이지</Link>
                  <button onClick={handleLogout} className="ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    로그아웃
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/mypage" element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">홈 페이지</h2>
                {currentUser ? (
                  <p>{currentUser.email}님, 환영합니다!</p>
                ) : (
                  <p>Google 계정으로 로그인해주세요.</p>
                )}
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

// App 컴포넌트를 직접 export 합니다.
// Router는 main.tsx에서 이미 App을 감싸고 있습니다.
export default App;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Google 로그인 버튼을 포함한 로그인 페이지 컴포넌트
 */
const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  /**
   * Google 로그인 팝업을 띄우는 함수
   */
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider(); // Google 인증 공급자 생성
    try {
      await signInWithPopup(auth, provider); // 팝업으로 로그인 시도
      navigate('/'); // 로그인 성공 시 홈으로 이동
    } catch (err: any) {
      setError(err.message);
      console.error('Google 로그인 에러:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">로그인</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

export default Login; 
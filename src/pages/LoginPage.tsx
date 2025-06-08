import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';

const LoginPage: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/'); // 로그인 성공 후 메인 페이지로 이동
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-xs w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Login</h1>
        <button
          onClick={handleLogin}
          className="w-full flex justify-center items-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FcGoogle size={22} />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 
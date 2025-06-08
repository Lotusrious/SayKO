import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';

const HomePage: React.FC = () => {
  const { currentUser, loginWithGoogle } = useAuth();

  const handleStart = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
        SayKO에 오신 것을 환영합니다!
      </h1>
      <p className="text-xl text-gray-700 mb-8">
        매일 새로운 단어를 학습하고 퀴즈로 실력을 테스트하세요.
      </p>
      <div className="w-full flex justify-center">
        {currentUser ? (
          <Link to="/learn" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            학습 시작하기
          </Link>
        ) : (
          <button 
            onClick={handleStart}
            className="flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-8 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
          >
            <FcGoogle size={22} />
            <span>구글 계정으로 계속하기</span>
          </button>
        )}
      </div>
      <div className="mt-12 p-6 border-t border-gray-200 w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">주요 기능</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">🗓️ 5-Cycle 학습법</h3>
            <p className="text-gray-600">
              점점 더 많은 단어를, 더 짧은 주기로 반복하여 장기 기억을 강화하는 5단계 학습 사이클을 제공합니다.
            </p>
          </div>
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">✍️ 간단한 테스트</h3>
            <p className="text-gray-600">
              매일 학습한 단어 중 25개를 랜덤으로 테스트하며 자신의 실력을 점검하고 복습 효과를 높일 수 있습니다.
            </p>
          </div>
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">🔊 TTS 발음 듣기 (예정)</h3>
            <p className="text-gray-600">
              단어와 예문의 정확한 발음을 원어민 음성으로 들으며 리스닝 실력까지 함께 향상시킬 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
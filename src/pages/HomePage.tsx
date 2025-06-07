import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
        SayKO에 오신 것을 환영합니다!
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        SayKO는 과학적인 반복 학습 사이클을 통해 효율적인 단어 암기를 돕는 서비스입니다. 매일 새로운 단어를 학습하고, 간단한 시험을 통해 실력을 확인하며 독일어 어휘를 정복해 보세요.
      </p>
      <div className="flex space-x-4">
        {currentUser ? (
          <>
            <Link
              to="/learn"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
              학습 이어서하기
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
          >
            Google 계정으로 시작하기
          </Link>
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
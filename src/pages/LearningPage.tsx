import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVocabularies } from '@/services/vocabularyService';
import type { Vocabulary } from '../types/firestore';
import { updateUserData } from '../services/userService';
import WordCard from '../components/WordCard';
import Modal from '../components/Modal';
import WordDetailModal from '@/components/WordDetailModal';

// 사이클 설정 타입 정의
interface CycleConfig {
  [key: number]: {
    wordsPerDay: number;
    duration: number;
  };
}

// 사이클 별 설정
const cycleConfig: CycleConfig = {
  1: { wordsPerDay: 25, duration: 20 }, // 500 / 25 = 20일
  2: { wordsPerDay: 50, duration: 10 }, // 500 / 50 = 10일
  3: { wordsPerDay: 100, duration: 5 }, // 500 / 100 = 5일
  4: { wordsPerDay: 250, duration: 2 }, // 500 / 250 = 2일
  5: { wordsPerDay: 500, duration: 1 }, // 500 / 500 = 1일
};

const LearningPage: React.FC = () => {
  const { currentUser, dbUser, refreshDbUser } = useAuth();
  const navigate = useNavigate();
  
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [todayWords, setTodayWords] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Vocabulary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allWords = await getVocabularies();
        setVocabularies(allWords);

        if (dbUser && dbUser.currentCycle && dbUser.currentDay) {
          const { currentCycle, currentDay } = dbUser;
          const config = cycleConfig[currentCycle];
          
          if (config) {
            const startIndex = (currentDay - 1) * config.wordsPerDay;
            const endIndex = startIndex + config.wordsPerDay;
            // 사이클마다 섞는 로직을 제거하고, 고정된 순서에서 자르기만 합니다.
            const words = allWords.slice(startIndex, endIndex);
            setTodayWords(words);
          }
        }
      } catch (error) {
        console.error("Failed to load vocabularies:", error);
        // 사용자에게 에러를 알려주는 UI 추가도 고려해볼 수 있습니다.
      } finally {
        setIsLoading(false);
      }
    };
    
    if (dbUser) {
      loadData();
    }
  }, [dbUser]);

  const handleLearningComplete = async () => {
    if (!currentUser || !dbUser) return;

    setIsCompleting(true);
    try {
      let nextDay = (dbUser.currentDay || 1) + 1;
      let nextCycle = dbUser.currentCycle || 1;
      const config = cycleConfig[nextCycle as keyof typeof cycleConfig] || cycleConfig[1];

      // 현재 사이클이 종료되었는지 확인
      if (nextDay > config.duration) {
        nextDay = 1; // 다음 사이클의 1일차로
        nextCycle += 1; // 다음 사이클로
        
        // 5 사이클이 끝나면 5 사이클을 반복
        if (nextCycle > 5) {
          nextCycle = 5;
        }
      }
      
      await updateUserData(currentUser.uid, { currentDay: nextDay, currentCycle: nextCycle });
      await refreshDbUser();

      alert('오늘의 학습을 완료했습니다! 수고하셨습니다.');
      navigate('/');
    } catch (error) {
      console.error("Failed to update user data:", error);
      alert('학습 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleWordClick = (wordKor: string) => {
    const foundWord = vocabularies.find(v => v.kor === wordKor);
    if (foundWord) {
      setSelectedWord(foundWord);
      setIsModalOpen(true);
    }
  };

  const handleStartTest = () => {
    const wordsForTest = [...todayWords];

    // 오늘의 단어가 25개를 초과하면, 그 중에서 25개를 랜덤으로 선택합니다.
    if (wordsForTest.length > 25) {
      const shuffled = wordsForTest.sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 25);
      navigate('/test', { state: { todayWords: selectedWords } });
    } else {
      // 오늘의 단어가 25개 이하이면 (Cycle 1), 모든 단어로 시험을 봅니다.
      navigate('/test', { state: { todayWords: wordsForTest } });
    }
  };

  if (isLoading) {
    return <div className="w-full text-center p-10">Loading today's words...</div>;
  }
  
  if (!dbUser) {
    // 이 경우는 거의 없지만, 방어 코드로 추가합니다.
    return <div className="w-full text-center p-10">User not found.</div>;
  }

  const currentCycle = dbUser?.currentCycle || 1;
  const currentDay = dbUser?.currentDay || 1;
  const config = cycleConfig[currentCycle as keyof typeof cycleConfig] || cycleConfig[1];
  const startIndex = (currentDay - 1) * config.wordsPerDay;

  if (todayWords.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">학습 완료</h1>
        <p>모든 단어 학습을 마쳤습니다. 대단해요!</p>
        <Link to="/" className="text-blue-500 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md"> {/* iPhone 16 Pro: 393px width */}
        <div className="text-center my-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Cycle {currentCycle} - Day {currentDay}
          </h1>
          <p className="text-md text-gray-600 mt-1">Today's {todayWords.length} words</p>
        </div>

        <div className="space-y-4">
          {todayWords.map((word, index) => (
            <WordCard 
              key={word.id}
              word={word}
              index={index + 1}
              onWordClick={handleWordClick}
            />
          ))}
        </div>
        
        <div className="mt-8 text-center space-y-3">
          <button 
            onClick={() => navigate('/image-cards', { state: { todayWords } })}
            className="w-full bg-black text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-800 transition-transform transform hover:scale-105"
          >
            Learn with Image Cards
          </button>
          <button 
            onClick={handleStartTest}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Take a Test
          </button>
        </div>
      </div>

      <WordDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        word={selectedWord}
      />
    </div>
  );
};

export default LearningPage; 
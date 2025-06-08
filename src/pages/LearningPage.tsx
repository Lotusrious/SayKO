import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWordsForDay, getTestResultsForUser, CYCLE_CONFIG } from '@/services/vocabularyService';
import type { Vocabulary } from '../types/firestore';
import { updateUserData } from '../services/userService';
import WordCard from '../components/WordCard';
import Modal from '../components/Modal';
import WordDetailModal from '@/components/WordDetailModal';

const LearningPage: React.FC = () => {
  const { currentUser, dbUser, refreshDbUser } = useAuth();
  const navigate = useNavigate();
  
  const [todayWords, setTodayWords] = useState<Vocabulary[]>([]);
  const [incorrectWordIds, setIncorrectWordIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Vocabulary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!dbUser || !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. 오늘의 단어 불러오기
        const { currentCycle, currentDay } = dbUser;
        if (typeof currentCycle === 'number' && typeof currentDay === 'number') {
          const words = await getWordsForDay(currentCycle, currentDay);
          setTodayWords(words);
        }

        // 2. 모든 시험 결과에서 틀린 단어 ID 집계하기
        const testResults = await getTestResultsForUser(currentUser.uid);
        console.log("Firestore에서 가져온 시험 결과:", testResults); // 디버깅용 로그

        const incorrectIds = new Set<string>();
        testResults.forEach(result => {
          result.results.forEach(answer => {
            if (!answer.isCorrect) {
              incorrectIds.add(answer.wordId);
            }
          });
        });
        setIncorrectWordIds(incorrectIds);
        console.log("집계된 틀린 단어 ID 목록:", incorrectIds); // 디버깅용 로그

      } catch (error) {
        console.error("Failed to load today's words or test results:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dbUser, currentUser]);

  const handleLearningComplete = async () => {
    if (!currentUser || !dbUser) return;

    setIsCompleting(true);
    try {
      let nextDay = (dbUser.currentDay || 1) + 1;
      let nextCycle = dbUser.currentCycle || 1;
      const config = CYCLE_CONFIG[nextCycle as keyof typeof CYCLE_CONFIG] || CYCLE_CONFIG[1];

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
    const foundWord = todayWords.find(v => v.kor === wordKor);
    if (foundWord) {
      setSelectedWord(foundWord);
      setIsModalOpen(true);
    }
  };

  const handleStartTest = () => {
    navigate('/test', { state: { words: todayWords } });
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
  const config = CYCLE_CONFIG[currentCycle as keyof typeof CYCLE_CONFIG] || CYCLE_CONFIG[1];

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
              isIncorrect={incorrectWordIds.has(word.id)}
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
            오늘의 단어 시험보기
          </button>
          <Link
            to="/test"
            className="w-full block bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            자유 시험 보기
          </Link>
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
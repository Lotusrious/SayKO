import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWordsForDay, getTestResultsForUser, CYCLE_CONFIG } from '@/services/vocabularyService';
import type { Vocabulary } from '../types/firestore';
import WordCard from '../components/WordCard';
import WordDetailModal from '@/components/WordDetailModal';

const LearningPage: React.FC = () => {
  const { currentUser, dbUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [todayWords, setTodayWords] = useState<Vocabulary[]>([]);
  const [incorrectWordIds, setIncorrectWordIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedWord, setSelectedWord] = useState<Vocabulary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!dbUser || !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let words: Vocabulary[] = [];
        const { currentCycle, currentDay } = dbUser;
        if (typeof currentCycle === 'number' && typeof currentDay === 'number') {
          words = await getWordsForDay(currentCycle, currentDay);
          setTodayWords(words);
        }

        const testResults = await getTestResultsForUser(currentUser.uid);
        const todaysIncorrectIds = new Set<string>();

        if (testResults.length > 0) {
          const latestResult = testResults[0];
          latestResult.results.forEach(answer => {
            if (!answer.isCorrect) {
              todaysIncorrectIds.add(answer.wordId.trim());
            }
          });
        }
        
        setIncorrectWordIds(todaysIncorrectIds);
        
      } catch (error) {
        console.error("Failed to load today's words or test results:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dbUser, currentUser, location]);

  const handleWordClick = (wordKor: string) => {
    const foundWord = todayWords.find(v => v.kor === wordKor);
    if (foundWord) {
      setSelectedWord(foundWord);
    }
  };
  
  const handleStartTest = () => {
    navigate('/test', { state: { words: todayWords } });
  };
  
  if (isLoading) {
    return <div className="w-full text-center p-10">Loading today's words...</div>;
  }
  
  if (!dbUser) {
    return <div className="w-full text-center p-10">User not found.</div>;
  }

  const currentCycle = dbUser?.currentCycle || 1;
  const currentDay = dbUser?.currentDay || 1;

  if (todayWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">학습 완료</h1>
        <p>모든 단어 학습을 마쳤습니다. 대단해요!</p>
        <Link to="/" className="text-blue-500 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md">
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
              isIncorrect={incorrectWordIds.has(word.id.trim())}
              onWordClick={handleWordClick}
            />
          ))}
        </div>
        
        <div className="mt-8 text-center space-y-3">
          <button 
            onClick={() => navigate('/image-cards', { state: { words: todayWords } })}
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
            state={{ words: todayWords, isFreeTest: true }}
            className="w-full block bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            자유 시험 보기
          </Link>
        </div>
      </div>

      <WordDetailModal
        isOpen={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        word={selectedWord}
      />
    </div>
  );
};

export default LearningPage;
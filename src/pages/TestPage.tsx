import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { saveTestResult, advanceUserProgress } from '@/services/vocabularyService';
import type { Vocabulary, TestAnswer } from '@/types/firestore';
import { getWordsForDay } from '@/services/vocabularyService';

const TestPage: React.FC = () => {
  const { currentUser, dbUser, refreshDbUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [testWords, setTestWords] = useState<Vocabulary[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFreeTest = location.state?.isFreeTest || false;

  const loadTestWords = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isFreeTest && dbUser && typeof dbUser.currentCycle === 'number' && typeof dbUser.currentDay === 'number') {
        const { currentCycle, currentDay } = dbUser;
        const words = await getWordsForDay(currentCycle, currentDay);
        setTestWords(words);
        setUserAnswers(new Array(words.length).fill(''));
      } else if (location.state?.words) {
        const words = location.state.words as Vocabulary[];
        setTestWords(words);
        setUserAnswers(new Array(words.length).fill(''));
      } else {
        navigate('/learn');
      }
    } catch (error) {
      console.error("Error loading test words:", error);
      navigate('/learn');
    } finally {
      setIsLoading(false);
    }
  }, [location.state, navigate, isFreeTest, dbUser]);

  useEffect(() => {
    loadTestWords();
  }, [loadTestWords]);

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !dbUser) return;
    setIsSubmitting(true);

    const results: TestAnswer[] = testWords.map((word, index) => ({
      wordId: word.id,
      kor: word.kor,
      eng: word.eng,
      userAnswer: userAnswers[index],
      isCorrect: userAnswers[index].trim().toLowerCase() === word.eng.trim().toLowerCase(),
    }));

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctAnswers / testWords.length) * 100);

    const { currentCycle = 1, currentDay = 1 } = dbUser;
    
    // 자유 시험 모드가 아니고, 80점 이상 받았을 때만 스테이지 자동 진행
    const passed = !isFreeTest && score >= 80;

    const resultData = {
      userId: currentUser.uid,
      results,
      score,
      cycle: currentCycle,
      day: currentDay,
      stageAdvanced: passed, // stageAdvanced를 통과 여부로 사용
      isFreeTest,
    };

    try {
      if (passed) {
        // 사용자의 학습 단계를 다음으로 진행시킵니다.
        await advanceUserProgress(currentUser.uid, currentCycle, currentDay);
        // AuthContext의 사용자 정보를 갱신합니다.
        await refreshDbUser();
      }
      const docId = await saveTestResult(currentUser.uid, resultData);
      // 결과 페이지로 이동할 때, 통과 여부를 state로 전달합니다.
      navigate('/test-result', { state: { resultId: docId, passed } });
    } catch (error) {
      console.error("Failed to save test result or advance progress:", error);
      alert("결과 저장 또는 진행 상태 업데이트에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading Test...</div>;
  }
  
  if (testWords.length === 0) {
    return <div className="flex justify-center items-center h-screen">시험 볼 단어가 없습니다.</div>;
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-2 text-center">Vocabulary Test</h1>
      <p className="text-center text-gray-600 mb-8">
        진행률: {userAnswers.filter(a => a.trim() !== '').length} / {testWords.length}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        {testWords.map((word, index) => (
          <div 
            key={word.id} 
            className="grid grid-cols-3 gap-2 items-center bg-white p-4 rounded-lg shadow-sm"
          >
            <label 
              htmlFor={`word-${index}`} 
              className="col-span-1 text-lg font-medium text-gray-800"
            >
              {index + 1}. {word.kor}
            </label>
            <input
              type="text"
              id={`word-${index}`}
              value={userAnswers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="col-span-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter the meaning"
            />
          </div>
        ))}
        <div className="text-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? '채점 중...' : '답안 제출하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestPage;
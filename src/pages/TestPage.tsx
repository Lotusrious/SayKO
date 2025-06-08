import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs, query, where, documentId, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Vocabulary } from '../types/firestore';
import { getWordsForDay } from '../services/vocabularyService';

const TestPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [testWords, setTestWords] = useState<Vocabulary[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTestWords = useCallback(async () => {
    setIsLoading(true);
    const wordsFromState = location.state?.words as Vocabulary[];

    // 1. LearningPage에서 단어를 직접 전달받은 경우
    if (wordsFromState && wordsFromState.length > 0) {
      setTestWords(wordsFromState);
      setUserAnswers(new Array(wordsFromState.length).fill(''));
      setIsLoading(false);
      return;
    }
    
    // 2. /test로 직접 접근한 경우 (자유 시험)
    if (dbUser && typeof dbUser.currentCycle === 'number' && typeof dbUser.currentDay === 'number') {
      try {
        const wordsForToday = await getWordsForDay(dbUser.currentCycle, dbUser.currentDay);
        if (wordsForToday.length > 0) {
          setTestWords(wordsForToday);
          setUserAnswers(new Array(wordsForToday.length).fill(''));
        } else {
          alert('오늘 학습할 단어가 없습니다.');
          navigate('/learn');
        }
      } catch (error) {
        console.error("오늘의 시험 단어를 불러오는 데 실패했습니다:", error);
        alert('시험 단어를 불러오는 데 실패했습니다.');
        navigate('/');
      }
    } else {
       // 로그인하지 않은 상태로 직접 접근 시
       alert("시험을 보려면 로그인이 필요합니다.");
       navigate('/login');
    }

    setIsLoading(false);
  }, [location.state, dbUser, navigate]);

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
    
    if (!currentUser || !dbUser) {
      alert("시험 결과를 저장하려면 로그인이 필요합니다.");
      navigate('/login');
      return;
    }
    
    if (userAnswers.some(answer => answer.trim() === '')) {
      if (!window.confirm('아직 모든 답을 입력하지 않았습니다. 제출하시겠습니까?')) {
        return;
      }
    }

    setIsSubmitting(true);

    const newResults = testWords.map((word, index) => {
      const userAnswer = userAnswers[index]?.trim() || '';
      const correctAnswer = word.eng?.trim() || '';
      return {
        wordId: word.id,
        kor: word.kor,
        eng: correctAnswer,
        userAnswer: userAnswer,
        isCorrect: userAnswer.toLowerCase() === correctAnswer.toLowerCase(),
      };
    });

    const score = (newResults.filter(r => r.isCorrect).length / testWords.length) * 100;
    
    // location.state.words가 있으면 '학습 사이클 시험', 없으면 '자유 시험'으로 구분
    const testType = location.state?.words ? 'cycle' : 'free';

    // 자유 시험(free)인 경우, 결과를 저장하지 않고 바로 결과 페이지로 이동
    if (testType === 'free') {
      navigate('/test-result', {
        state: {
          results: newResults,
          score: score,
          testType: 'free',
        }
      });
      return;
    }
    
    // 학습 사이클 시험(cycle)인 경우, 결과를 Firestore에 저장
    const cycle = dbUser.currentCycle;
    const day = dbUser.currentDay;

    try {
      const docRef = await addDoc(collection(db, "testResults"), {
        userId: currentUser.uid,
        results: newResults,
        score: score,
        createdAt: serverTimestamp(),
        // 자유 시험 모드를 구분하기 위한 필드 추가
        testType,
        cycle,
        day,
      });

      // 학습 사이클 시험인 경우에만 stage advanced 로직을 적용해야 함
      // (이 부분은 TestResultPage에서 처리하는 것이 더 적합할 수 있음)
      
      navigate(`/test-result/${docRef.id}`);
    } catch (error) {
      console.error('Error submitting test results:', error);
      alert('결과를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Test...</div>;
  }

  if (testWords.length === 0) {
    return <div className="flex justify-center items-center h-screen">단어를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-2 text-center">Vocabulary Test</h1>
      <p className="text-center text-gray-600 mb-8">
        Progress: {userAnswers.filter(a => a.trim() !== '').length} / {testWords.length}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestPage;
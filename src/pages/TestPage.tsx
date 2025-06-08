import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

    if (wordsFromState && wordsFromState.length > 0) {
      setTestWords(wordsFromState);
      setUserAnswers(new Array(wordsFromState.length).fill(''));
      setIsLoading(false);
      return;
    }
    
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
    
    const isFreeTest = location.state?.words ? false : true;

    const resultData = {
      results: newResults,
      score: score,
      cycle: dbUser.currentCycle,
      day: dbUser.currentDay,
      isFreeTest,
    };
    
    navigate('/test-result', { state: { resultData } });
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
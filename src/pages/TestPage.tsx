import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Vocabulary } from '../types/firestore';
import { getVocabularies } from '../services/vocabularyService';

const TestPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [testWords, setTestWords] = useState<Vocabulary[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepareTestWords() {
      setIsLoading(true);
      const wordsFromState = location.state?.todayWords as Vocabulary[];
      
      if (wordsFromState && wordsFromState.length > 0) {
        // LearningPage에서 단어를 전달받은 경우
        setTestWords(wordsFromState);
        setUserAnswers(new Array(wordsFromState.length).fill(''));
      } else {
        // HomePage 등 다른 경로에서 바로 접근한 경우, 랜덤 단어 25개 선택
        try {
          const allWords = await getVocabularies();
          const shuffled = [...allWords].sort(() => 0.5 - Math.random());
          const words = shuffled.slice(0, 25);
          
          if (words.length > 0) {
            setTestWords(words);
            setUserAnswers(new Array(words.length).fill(''));
          } else {
            alert('시험에 사용할 단어가 없습니다.');
            navigate('/learn');
          }
        } catch (error) {
          console.error("시험 단어를 불러오는 데 실패했습니다:", error);
          alert('시험 단어를 불러오는 데 실패했습니다.');
          navigate('/learn');
        }
      }
      setIsLoading(false);
    }
    prepareTestWords();
  }, [location.state, navigate]);

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = answer;
    setUserAnswers(newAnswers);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !dbUser) {
        alert('로그인 및 사용자 정보가 필요합니다.');
        navigate('/login');
        return;
    }
    setIsSubmitting(true);

    const newResults = testWords.map((word, index) => {
      const userAnswer = userAnswers[index]?.trim() || '';
      const correctAnswer = word.eng?.trim() || '';
      const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      return {
        wordId: word.id,
        question: word.kor,
        userAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    try {
        const resultDocRef = await addDoc(collection(db, 'testResults'), {
            userId: currentUser.uid,
            date: serverTimestamp(),
            cycle: dbUser.currentCycle || 1,
            day: dbUser.currentDay || 1,
            answers: newResults,
        });
        navigate(`/test-result/${resultDocRef.id}`);

    } catch (error) {
        console.error('Error submitting test results:', error);
        alert('결과를 저장하는 중 오류가 발생했습니다.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading test...</div>;
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
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? '채점 중...' : '제출하고 결과 보기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestPage;
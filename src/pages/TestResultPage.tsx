import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTestResultById } from '@/services/vocabularyService';
import type { TestResult, Vocabulary } from '@/types/firestore';

const TestResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const passed = location.state?.passed || false;

  useEffect(() => {
    const fetchResult = async () => {
      const resultId = location.state?.resultId;
      
      if (!resultId || !currentUser) {
        setLoading(false);
        console.error("결과 ID가 없거나 사용자가 로그인하지 않았습니다.");
        navigate('/');
        return;
      }

      try {
        const fetchedResult = await getTestResultById(currentUser.uid, resultId);
        setResult(fetchedResult);
      } catch (error) {
        console.error("시험 결과를 불러오는 데 실패했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [location.state, currentUser, navigate]);

  const handleRetakeAll = () => {
    if (!result) return;

    // 현재 시험의 모든 단어를 가져와 다시 시험을 봅니다.
    const allWordsForRetake = result.results
      .map((ans): Vocabulary => ({
        id: ans.wordId,
        kor: ans.kor,
        eng: ans.eng,
        category: '',
        priority: 0,
        meaning: '',
        examples: [],
        pronunciation: '',
      }));
    
    navigate('/test', { state: { words: allWordsForRetake } });
  };

  if (loading) {
    return <div>결과를 불러오는 중입니다...</div>;
  }

  if (!result) {
    return <div>결과를 찾을 수 없습니다.</div>;
  }

  const correctAnswersCount = result.results.filter(answer => answer.isCorrect).length;
  const totalQuestions = result.results.length;
  const percentage = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-center">시험 결과</h1>
      {result && result.cycle && result.day && !result.isFreeTest && (
        <p className="text-center text-gray-600 mb-4">
          (Cycle {result.cycle} - Day {result.day})
        </p>
      )}

      <div className={`bg-white shadow-md rounded-lg p-6 mb-6 text-center`}>
        <p className="text-5xl font-bold text-blue-600">
          {correctAnswersCount} / {totalQuestions}
        </p>
        <p className="text-xl text-gray-600 mt-2">정답률: {percentage.toFixed(0)}%</p>
      </div>
      
      <div className="flex justify-center space-x-4 mb-8">
        {passed ? (
          <button 
            onClick={() => navigate('/learn')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg animate-pulse"
          >
            다음 스테이지로!
          </button>
        ) : (
          <>
            <button 
              onClick={() => navigate('/learn')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              학습 페이지로 돌아가기
            </button>
            <button 
              onClick={handleRetakeAll} 
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            >
              문제 다시 풀기
            </button>
          </>
        )}
      </div>

      <div className="space-y-4">
        {result.results.map((answer, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex items-center justify-between ${
              answer.isCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex items-center">
              <p className="font-semibold text-lg">
                {answer.kor}
                <span className={`ml-2 font-bold ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  ({answer.isCorrect ? 'O' : 'X'})
                </span>
              </p>
            </div>
            <div>
              {!answer.isCorrect && (
                <p className="text-sm text-right"><span className="font-bold">정답:</span> {answer.eng}</p>
              )}
              <p className="text-gray-700 text-sm text-right"><span className="font-bold">제출한 답:</span> {answer.userAnswer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestResultPage; 
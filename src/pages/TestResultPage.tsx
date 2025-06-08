import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import type { TestResult, Vocabulary } from '@/types/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { saveTestResult, CYCLE_CONFIG } from '@/services/vocabularyService';

const TestResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, dbUser, refreshDbUser } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  useEffect(() => {
    const processResult = async () => {
      const resultData = location.state?.resultData;
      
      if (!resultData || !currentUser) {
        setLoading(false);
        console.error("결과 데이터가 없거나 사용자가 로그인하지 않았습니다.");
        // navigate('/'); // 사용자를 홈페이지로 리디렉션할 수 있습니다.
        return;
      }

      if (resultData.isFreeTest) {
        // 자유 시험 모드 결과 처리
        const freeTestResult: TestResult = {
          id: 'free-test-' + new Date().getTime(),
          userId: currentUser.uid,
          createdAt: new Date(),
          ...resultData
        };
        setResult(freeTestResult);
      } else {
        // 일반 시험 모드 결과 처리 (저장)
        try {
          // Firestore에 저장할 데이터에서 id와 createdAt을 제외합니다.
          const { results, score, cycle, day } = resultData;
          const dataToSave = { userId: currentUser.uid, results, score, cycle, day, stageAdvanced: false };
          
          const docId = await saveTestResult(currentUser.uid, dataToSave);
          
          const finalResult: TestResult = {
            id: docId,
            createdAt: new Date(), // serverTimestamp는 저장 시에만 사용되므로, 화면 표시는 현재 시간으로.
            ...dataToSave
          };
          setResult(finalResult);

        } catch (error) {
          console.error("시험 결과 저장에 실패했습니다:", error);
        }
      }
      setLoading(false);
    };

    processResult();
  }, [location.state, currentUser, navigate]);

  const handleNextStage = async () => {
    if (!currentUser || !dbUser || !result || result.isFreeTest) return;
    
    if (result.stageAdvanced) {
        alert("이미 다음 스테이지로 이동 처리된 결과입니다.");
        return;
    }

    setIsUpdatingStage(true);

    const userRef = doc(db, 'users', currentUser.uid);
    const resultRef = doc(db, 'users', currentUser.uid, 'testResults', result.id);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw "User document does not exist!";
        }
        
        const userData = userDoc.data();
        let nextDay = (userData.currentDay || 1) + 1;
        let nextCycle = userData.currentCycle || 1;
        const config = CYCLE_CONFIG[nextCycle] || CYCLE_CONFIG[1];

        if (nextDay > config.duration) {
          nextDay = 1;
          nextCycle += 1;
          if (nextCycle > 5) nextCycle = 5;
        }
        
        transaction.update(userRef, { currentDay: nextDay, currentCycle: nextCycle });
        transaction.update(resultRef, { stageAdvanced: true });
      });

      await refreshDbUser();
      
      setTimeout(() => {
        navigate('/learn');
      }, 1000);

    } catch (error) {
      console.error("Failed to update user data in transaction:", error);
      setIsUpdatingStage(false);
    }
  };

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
        imageUrl: '',
      }));
    
    navigate('/test', { state: { words: allWordsForRetake } });
  };

  if (loading) {
    return <div>결과를 불러오는 중입니다...</div>;
  }

  if (isUpdatingStage) {
    return (
      <div className="fixed inset-0 bg-blue-500 flex flex-col justify-center items-center text-white transition-opacity duration-500">
        <h2 className="text-4xl font-bold animate-pulse">다음 스테이지로 이동합니다!</h2>
        <p className="mt-4 text-lg">잠시만 기다려주세요...</p>
      </div>
    );
  }

  if (!result) {
    return <div>결과를 찾을 수 없습니다.</div>;
  }

  const correctAnswersCount = result.results.filter(answer => answer.isCorrect).length;
  const totalQuestions = result.results.length;
  const percentage = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
  
  // 20문제 이상 맞췄는지 여부
  const canAdvance = correctAnswersCount >= 20;

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
        <Link to="/learn" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded inline-block">
          학습 페이지로 돌아가기
        </Link>
        <button onClick={handleRetakeAll} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
          문제 다시 풀기
        </button>
        {/* 20문제 이상 맞았고, 정식 시험일 경우 '다음 스테이지' 버튼 표시 */}
        {canAdvance && !result.isFreeTest && (
          <button 
            onClick={handleNextStage} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            disabled={isUpdatingStage || result.stageAdvanced}
          >
            {result.stageAdvanced ? '완료됨' : (isUpdatingStage ? '이동 중...' : '다음 스테이지로 가기')}
          </button>
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
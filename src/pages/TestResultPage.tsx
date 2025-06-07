import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import type { TestResult, Vocabulary } from '@/types/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserData } from '@/services/userService';

// 사이클 별 설정 (LearningPage와 동일한 설정)
const cycleConfig: { [key: number]: { wordsPerDay: number; duration: number; } } = {
  1: { wordsPerDay: 25, duration: 20 },
  2: { wordsPerDay: 50, duration: 10 },
  3: { wordsPerDay: 100, duration: 5 },
  4: { wordsPerDay: 250, duration: 2 },
  5: { wordsPerDay: 500, duration: 1 },
};

const TestResultPage = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { currentUser, dbUser, refreshDbUser } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) return;
      try {
        const resultDoc = await getDoc(doc(db, 'testResults', resultId));
        if (resultDoc.exists()) {
          const data = resultDoc.data();
          const resultData: TestResult = {
            id: resultDoc.id,
            userId: data.userId,
            date: data.date.toDate(),
            cycle: data.cycle,
            day: data.day,
            answers: data.answers,
            stageAdvanced: data.stageAdvanced,
          };
          setResult(resultData);
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  const handleNextStage = async () => {
    if (!currentUser || !dbUser || !result) return;
    
    // 이미 처리된 결과이면 함수를 즉시 종료
    if (result.stageAdvanced) {
        alert("이미 다음 스테이지로 이동 처리된 결과입니다.");
        return;
    }

    setIsUpdatingStage(true);

    const userRef = doc(db, 'users', currentUser.uid);
    const resultRef = doc(db, 'testResults', result.id);

    try {
      await runTransaction(db, async (transaction) => {
        // 트랜잭션 내에서 최신 사용자 데이터를 다시 읽어옵니다.
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw "User document does not exist!";
        }
        
        const userData = userDoc.data();
        let nextDay = (userData.currentDay || 1) + 1;
        let nextCycle = userData.currentCycle || 1;
        const config = cycleConfig[nextCycle] || cycleConfig[1];

        if (nextDay > config.duration) {
          nextDay = 1;
          nextCycle += 1;
          if (nextCycle > 5) nextCycle = 5;
        }
        
        // 트랜잭션 내에서 업데이트를 수행합니다.
        transaction.update(userRef, { currentDay: nextDay, currentCycle: nextCycle });
        transaction.update(resultRef, { stageAdvanced: true });
      });

      // 트랜잭션 성공 후 상태 업데이트 및 화면 전환
      await refreshDbUser();
      
      setTimeout(() => {
        navigate('/learn');
      }, 1000);

    } catch (error) {
      console.error("Failed to update user data in transaction:", error);
      setIsUpdatingStage(false);
    }
  };

  const handleRetakeTest = () => {
    if (!result) return;
    // 재시험을 위해 단어 목록을 재구성합니다.
    const wordsForRetake = result.answers.map(ans => ({
      id: ans.wordId,
      kor: ans.question,
      eng: ans.correctAnswer,
    })) as Vocabulary[]; // 타입 단언 사용, 필요한 최소 필드만 포함
    
    navigate('/test', { state: { todayWords: wordsForRetake } });
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

  const score = result.answers.filter(answer => answer.isCorrect).length;
  const totalQuestions = result.answers.length;
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const isPassed = percentage >= 80;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-center">시험 결과</h1>
      {result.cycle && result.day && (
        <p className="text-center text-gray-600 mb-4">
          (Cycle {result.cycle} - Day {result.day})
        </p>
      )}

      <div className={`bg-white shadow-md rounded-lg p-6 mb-6 text-center ${isPassed ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
        <h2 className={`text-4xl font-bold mb-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
          {isPassed ? '통과!' : '아쉬워요!'}
        </h2>
        <p className="text-5xl font-bold text-blue-600">
          {score} / {totalQuestions}
        </p>
        <p className="text-xl text-gray-600 mt-2">정답률: {percentage.toFixed(0)}%</p>
      </div>
      
      <div className="flex justify-center space-x-4 mb-8">
        {isPassed ? (
          <>
            <button 
              onClick={handleNextStage} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
              disabled={isUpdatingStage || result?.stageAdvanced}
            >
              {result?.stageAdvanced ? '완료됨' : (isUpdatingStage ? '이동 중...' : '다음 스테이지로 가기')}
            </button>
            <button onClick={handleRetakeTest} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
              재시험 보기
            </button>
          </>
        ) : (
          <>
            <button onClick={handleRetakeTest} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              재시험 보기
            </button>
            <Link to="/learn" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded inline-block">
              학습 페이지로 돌아가기
            </Link>
          </>
        )}
      </div>

      <div className="space-y-4">
        {result.answers.map((answer, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex items-center justify-between ${
              answer.isCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex items-center">
              <span className={`text-2xl mr-4 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {answer.isCorrect ? 'O' : 'X'}
              </span>
              <div>
                <p className="font-semibold text-lg">{answer.question}</p>
                {!answer.isCorrect && (
                  <p className="text-sm"><span className="font-bold">정답:</span> {answer.correctAnswer}</p>
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm"><span className="font-bold">제출한 답:</span> {answer.userAnswer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestResultPage; 
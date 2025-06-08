import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MyPage.css'; // 커스텀 CSS 파일 임포트
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns-tz';
import { getVocabularies, CYCLE_CONFIG } from '../services/vocabularyService';

// 시험 결과 데이터 타입을 정의합니다.
interface WordResult {
  kor: string;
  eng: string;
  userAnswer: string;
  isCorrect: boolean;
  wordId: string;
}

interface TestResult {
  id: string;
  cycle: number;
  day: number;
  score: number;
  createdAt: Timestamp;
  results: WordResult[];
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

/**
 * 간단한 마이페이지 컴포넌트
 */
const MyPage: React.FC = () => {
  const { currentUser, dbUser, loading } = useAuth();
  const location = useLocation(); // 라우터의 위치 정보를 가져옵니다.
  const [value, onChange] = useState<Value>(new Date());
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [resultsForSelectedDate, setResultsForSelectedDate] = useState<TestResult[]>([]);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [completionRate, setCompletionRate] = useState(0);
  
  const KST_TIMEZONE = 'Asia/Seoul';

  // 학습 완료율 계산
  useEffect(() => {
    const calculateCompletion = async () => {
      if (!dbUser) return;

      const totalWords = (await getVocabularies()).length;
      if (totalWords === 0) return;

      let learnedWords = 0;
      const currentCycle = dbUser.currentCycle || 1;
      const currentDay = dbUser.currentDay || 1;

      // 지난 사이클에서 학습한 단어 수
      for (let i = 1; i < currentCycle; i++) {
        const cycleConfig = CYCLE_CONFIG[i];
        learnedWords += cycleConfig.wordsPerDay * cycleConfig.duration;
      }
      
      // 현재 사이클에서 (어제까지) 학습한 단어 수
      const currentCycleConfig = CYCLE_CONFIG[currentCycle];
      learnedWords += currentCycleConfig.wordsPerDay * (currentDay - 1);

      const rate = Math.round((learnedWords / totalWords) * 100);
      setCompletionRate(rate);
    };

    calculateCompletion();
  }, [dbUser]);

  // location이 변경될 때마다 데이터를 다시 불러옵니다.
  useEffect(() => {
    const fetchTestResults = async () => {
      if (currentUser) {
        console.log("MyPage: Fetching test results for user:", currentUser.uid);
        try {
          const q = query(collection(db, 'users', currentUser.uid, 'testResults'));
          const querySnapshot = await getDocs(q);
          console.log("MyPage: Fetched documents count:", querySnapshot.size);

          const results = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as TestResult))
            .filter(result => result.createdAt && typeof result.createdAt.toDate === 'function');

          console.log("MyPage: Processed test results array:", results);
          setAllTestResults(results);
        } catch (error) {
          console.error("시험 기록을 불러오는 데 실패했습니다:", error);
        }
      }
    };

    fetchTestResults();
  }, [currentUser, location]); // location을 의존성 배열에 추가

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>로딩 중...</div>
      </div>
    );
  }
  
  // Date 객체를 'yyyy-MM-dd' 형식의 KST 문자열로 변환하는 단일 함수
  const getKST_YYYY_MM_DD = (date: Date): string => {
    return format(date, 'yyyy-MM-dd', { timeZone: KST_TIMEZONE });
  }

  // 날짜별 시험 정보(시험 유무, 100점 통과 유무)를 미리 계산합니다.
  const testDayInfo = allTestResults.reduce((acc, result) => {
    const dateStr = getKST_YYYY_MM_DD(result.createdAt.toDate());
    if (!acc[dateStr]) {
      acc[dateStr] = { hasTest: true, hasPerfectScore: false };
    }
    if (result.score >= 80) {
      acc[dateStr].hasPerfectScore = true;
    }
    return acc;
  }, {} as Record<string, { hasTest: boolean; hasPerfectScore: boolean }>);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const formattedClickedDate = getKST_YYYY_MM_DD(date);
    const filteredResults = allTestResults
      .filter(result => {
        const formattedResultDate = getKST_YYYY_MM_DD(result.createdAt.toDate());
        return formattedResultDate === formattedClickedDate;
      })
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    setResultsForSelectedDate(filteredResults);
    setExpandedResultId(null); // 날짜를 새로 클릭하면 펼쳐진 결과를 닫습니다.
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          마이 페이지
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* 사용자 정보 섹션 */}
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">내 정보</h2>
            {currentUser && dbUser ? (
              <div className="space-y-6 text-base">
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="text-gray-900 font-semibold">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <p className="text-gray-900 font-semibold">{currentUser.displayName || '정보 없음'}</p>
                </div>
                
                <hr className="my-6" />

                <h3 className="text-xl font-bold text-gray-800 mb-4">학습 현황</h3>
                <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">현재 학습 사이클</p>
                      <p className="text-gray-900 font-semibold">{dbUser.currentCycle || 1} 주기</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">현재 학습일</p>
                      <p className="text-gray-900 font-semibold">{dbUser.currentDay || 1} 일차</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">학습 완료율</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-sm text-gray-600 font-medium mt-1">{completionRate}%</p>
                    </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">사용자 정보를 표시할 수 없습니다.</p>
            )}
          </div>

          {/* 학습 기록 달력 섹션 */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
            <Calendar
              onChange={onChange}
              value={value}
              locale="ko-KR"
              onClickDay={handleDateClick}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dateStr = getKST_YYYY_MM_DD(date);
                  const info = testDayInfo[dateStr];
                  if (info?.hasTest) {
                    const dotClassName = info.hasPerfectScore ? "dot pass" : "dot";
                    return <div className={dotClassName}></div>;
                  }
                }
                return null;
              }}
              formatShortWeekday={(_, date) => ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
              navigationLabel={({ date }) => (
                <div className="text-center font-bold">
                  <span className="text-lg">{date.getFullYear()}</span>
                  <span className="text-2xl block mt-1">{date.toLocaleString('ko-KR', { month: 'long' })}</span>
                </div>
              )}
            />
          </div>
        </div>

        {/* 선택된 날짜의 시험 결과 */}
        {selectedDate && (
          <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 시험 결과
            </h2>
            {resultsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {resultsForSelectedDate.map((result, index) => (
                  <div key={result.id} className="result-card">
                    <div 
                      className="p-4 bg-gray-50 rounded-lg flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedResultId(expandedResultId === result.id ? null : result.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-500">{index + 1}번째 시도</span>
                        <span className="font-semibold text-gray-700">사이클 {result.cycle} - {result.day}일차</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.score >= 80 && (
                          <span className="pass-badge">통과!</span>
                        )}
                        <span className="font-bold text-blue-600 text-xl">{result.score}%</span>
                      </div>
                    </div>
                    {expandedResultId === result.id && (
                      <div className="result-details">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th>결과</th>
                              <th>단어</th>
                              <th>정답</th>
                              <th>내 답변</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.results.map((wordRes, wordIndex) => (
                              <tr key={wordIndex} className={wordRes.isCorrect ? 'correct' : 'incorrect'}>
                                <td>{wordRes.isCorrect ? '✅' : '❌'}</td>
                                <td>{wordRes.kor}</td>
                                <td>{wordRes.eng}</td>
                                <td>
                                  {wordRes.isCorrect 
                                    ? <span className="text-gray-400">-</span> 
                                    : <span className="user-answer">{wordRes.userAnswer || '미입력'}</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-500 text-center py-4">해당 날짜의 시험 기록이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage; 
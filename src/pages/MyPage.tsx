import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MyPage.css'; // Custom CSS import
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns-tz';
import { getVocabularies, CYCLE_CONFIG } from '../services/vocabularyService';
import { getTestResultsForUser } from '../services/userService';
import type { TestResult, TestAnswer as WordResult } from '../types/firestore.d';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

/**
 * MyPage Component
 */
const MyPage: React.FC = () => {
  const { currentUser, dbUser, loading } = useAuth();
  const location = useLocation();
  const [value, onChange] = useState<Value>(new Date());
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [resultsForSelectedDate, setResultsForSelectedDate] = useState<TestResult[]>([]);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [completionRate, setCompletionRate] = useState(0);
  
  const KST_TIMEZONE = 'Asia/Seoul'; // Using KST for consistency, but can be adapted

  // Calculate learning completion rate
  useEffect(() => {
    const calculateCompletion = async () => {
      if (!dbUser) return;

      const totalWords = (await getVocabularies()).length;
      if (totalWords === 0) return;

      let learnedWords = 0;
      const currentCycle = dbUser.currentCycle || 1;
      const currentDay = dbUser.currentDay || 1;

      // Words learned in previous cycles
      for (let i = 1; i < currentCycle; i++) {
        const cycleConfig = CYCLE_CONFIG[i];
        if (cycleConfig) {
          learnedWords += cycleConfig.wordsPerDay * cycleConfig.duration;
        }
      }
      
      // Words learned in the current cycle (up to yesterday)
      const currentCycleConfig = CYCLE_CONFIG[currentCycle];
      if (currentCycleConfig) {
        learnedWords += currentCycleConfig.wordsPerDay * (currentDay - 1);
      }

      const rate = Math.round((learnedWords / totalWords) * 100);
      setCompletionRate(rate);
    };

    if(dbUser) {
      calculateCompletion();
    }
  }, [dbUser]);

  // Fetch test results from Firestore
  useEffect(() => {
    const fetchTestResults = async () => {
      if (currentUser) {
        try {
          const results = await getTestResultsForUser(currentUser.uid);
          setAllTestResults(results);
        } catch (error) {
          console.error("Failed to load test history:", error);
        }
      }
    };

    fetchTestResults();
  }, [currentUser, location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }
  
  const getUTC_YYYY_MM_DD = (date: Date): string => {
    return format(date, 'yyyy-MM-dd', { timeZone: 'UTC' });
  }

  // Pre-calculate test info by date to display dots on the calendar
  const testDayInfo = allTestResults.reduce((acc, result) => {
    const date = result.createdAt.toDate();
    const dateStr = getUTC_YYYY_MM_DD(date);
    if (!acc[dateStr]) {
      acc[dateStr] = { hasTest: true, hasPerfectScore: false };
    }
    if (result.score >= 80) {
      acc[dateStr].hasPerfectScore = true;
    }
    return acc;
  }, {} as Record<string, { hasTest: boolean; hasPerfectScore: boolean }>);

  // Calendar date click handler
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const formattedClickedDate = getUTC_YYYY_MM_DD(date);
    const filteredResults = allTestResults
      .filter(result => {
        const resultDate = result.createdAt.toDate();
        const formattedResultDate = getUTC_YYYY_MM_DD(resultDate);
        return formattedResultDate === formattedClickedDate;
      })
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    setResultsForSelectedDate(filteredResults);
    setExpandedResultId(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          My Page
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* User Info Section */}
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Info</h2>
            {currentUser && dbUser ? (
              <div className="space-y-6 text-base">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-semibold">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900 font-semibold">{currentUser.displayName || 'No Information'}</p>
                </div>
                
                <hr className="my-6" />

                <h3 className="text-xl font-bold text-gray-800 mb-4">Learning Status</h3>
                <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Learning Cycle</p>
                      <p className="text-gray-900 font-semibold">Cycle {dbUser.currentCycle || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Learning Day</p>
                      <p className="text-gray-900 font-semibold">Day {dbUser.currentDay || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completion Rate</p>
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
              <p className="text-sm text-gray-500">Could not display user information.</p>
            )}
          </div>

          {/* Learning Record Calendar Section */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
            <Calendar
              onChange={onChange}
              value={value}
              locale="en-US"
              onClickDay={handleDateClick}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dateStr = getUTC_YYYY_MM_DD(date);
                  const info = testDayInfo[dateStr];
                  if (info?.hasTest) {
                    const dotClassName = info.hasPerfectScore ? "dot pass" : "dot";
                    return <div className={dotClassName}></div>;
                  }
                }
                return null;
              }}
              formatShortWeekday={(_, date) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
              navigationLabel={({ date }) => (
                <div className="text-center font-bold">
                  <span className="text-lg">{date.getFullYear()}</span>
                  <span className="text-2xl block mt-1">{date.toLocaleString('en-US', { month: 'long' })}</span>
                </div>
              )}
            />
          </div>
        </div>

        {/* Test results for the selected date */}
        {selectedDate && (
          <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Test Results for {selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                        <span className="text-sm font-medium text-gray-500">Attempt #{index + 1}</span>
                        <span className="font-semibold text-gray-700">Cycle {result.cycle} - Day {result.day}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.score >= 80 && (
                          <span className="pass-badge">Pass!</span>
                        )}
                        <span className="font-bold text-blue-600 text-xl">{result.score}%</span>
                      </div>
                    </div>
                    {expandedResultId === result.id && (
                      <div className="result-details">
                        {/* === Responsive result display: Table for desktop, cards for mobile === */}

                        {/* Desktop View (md size and up) */}
                        <table className="w-full hidden md:table">
                          <thead>
                            <tr className="text-left text-sm text-gray-500">
                              <th className="p-3 font-medium text-center">Result</th>
                              <th className="p-3 font-medium">Word</th>
                              <th className="p-3 font-medium">Correct Answer</th>
                              <th className="p-3 font-medium">Your Answer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.results.map((wordResult: WordResult, wordIndex) => (
                              <tr 
                                key={wordIndex} 
                                className={`border-t ${wordResult.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}
                              >
                                <td className="p-3 text-center">
                                  {wordResult.isCorrect ? (
                                    <svg className="w-6 h-6 text-green-500 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                  ) : (
                                    <svg className="w-6 h-6 text-red-500 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                  )}
                                </td>
                                <td className="p-3 font-semibold">{wordResult.word}</td>
                                <td className="p-3">{wordResult.correctAnswer}</td>
                                <td className="p-3">{wordResult.userAnswer}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Mobile View (below md size) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                          {result.results.map((wordResult: WordResult, wordIndex) => (
                            <div 
                              key={wordIndex}
                              className={`p-4 rounded-lg ${wordResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-lg text-gray-800">{wordResult.word}</p>
                                {wordResult.isCorrect ? (
                                  <span className="text-sm font-bold text-green-600">Correct</span>
                                ) : (
                                  <span className="text-sm font-bold text-red-600">Incorrect</span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-semibold text-gray-600">Your Answer:</span> {wordResult.userAnswer || 'N/A'}</p>
                                <p><span className="font-semibold text-gray-600">Correct Answer:</span> {wordResult.correctAnswer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No test results for this date.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiTarget, FiCheckSquare, FiTrendingUp } from 'react-icons/fi';
import { calculateLearnedWords } from '../services/userService';

// 로그인한 사용자를 위한 대시보드 컴포넌트
const Dashboard: React.FC = () => {
  const { currentUser, dbUser } = useAuth();
  const [learnedWords, setLearnedWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    if (dbUser) {
      calculateLearnedWords(dbUser).then(({ learnedWords, totalWords }) => {
        setLearnedWords(learnedWords);
        setTotalWords(totalWords);
      });
    }
  }, [dbUser]);

  const completionRate = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;

  if (!dbUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {currentUser?.displayName || 'User'}!
        </h1>
        <p className="text-gray-600 mb-8">Here's your learning dashboard. Keep up the great work!</p>

        <div className="bg-white p-8 rounded-2xl shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-500">Current Stage</p>
              <p className="text-2xl font-bold text-blue-600">
                Cycle {dbUser.currentCycle} - Day {dbUser.currentDay}
              </p>
            </div>
            <Link to="/learn" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
              Continue Learning
            </Link>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${completionRate}%` }}></div>
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">
              {learnedWords} / {totalWords} words completed
            </p>
          </div>
        </div>
        
        {/* 추가적인 위젯 공간 */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl shadow">
             <h3 className="font-bold text-lg mb-2">Review Mistakes</h3>
             <p className="text-gray-600 mb-4">Go over the words you've previously missed.</p>
             <Link to="/review" className="text-blue-600 font-semibold hover:underline">Start Review →</Link>
           </div>
           <div className="bg-white p-6 rounded-xl shadow">
             <h3 className="font-bold text-lg mb-2">My Page</h3>
             <p className="text-gray-600 mb-4">Check your detailed test history and calendar.</p>
             <Link to="/mypage" className="text-blue-600 font-semibold hover:underline">View My Page →</Link>
           </div>
        </div>
      </div>
    </div>
  );
};


// 비로그인 사용자를 위한 랜딩 페이지 컴포넌트
const LandingPage = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
     <div className="bg-slate-50 text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-white shadow-sm">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          Master Words, Faster.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Utilize our 5-cycle learning system to effectively memorize essential vocabulary and track your progress towards fluency.
        </p>
        <div className="flex justify-center">
            <button 
              onClick={handleLogin}
              className="flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
            >
              <FcGoogle size={24} />
              <span>Continue with Google</span>
            </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why SayKO Works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-6 bg-white rounded-xl shadow">
              <FiTarget className="text-blue-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Structured Learning Cycles</h3>
              <p className="text-gray-600">
                Reinforce memory with our 5-cycle system, reviewing words in increasing intervals for long-term retention.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow">
              <FiCheckSquare className="text-blue-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Quizzes</h3>
              <p className="text-gray-600">
                Test your knowledge with daily random quizzes to check your progress and enhance recall.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow">
              <FiTrendingUp className="text-blue-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
              <p className="text-gray-600">
                Visualize your learning journey, review test results, and stay motivated on your path to mastery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-12">Get Started in 3 Easy Steps</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-200 mb-2">1</div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your account in seconds with Google.</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-200 mb-2">2</div>
              <h3 className="text-xl font-semibold mb-2">Learn Daily</h3>
              <p className="text-gray-600">Follow the learning cycle to study new words each day.</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-200 mb-2">3</div>
              <h3 className="text-xl font-semibold mb-2">Test & Review</h3>
              <p className="text-gray-600">Take quizzes and check your results to grow.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-lg text-gray-600 mb-8">Sign up now and take the first step towards vocabulary mastery.</p>
        <div className="flex justify-center">
              <button 
                onClick={handleLogin}
                className="flex items-center justify-center gap-3 mx-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                <span>Sign Up for Free</span>
              </button>
        </div>
      </section>
    </div>
  );
}

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  return currentUser ? <Dashboard /> : <LandingPage />;
};

export default HomePage; 
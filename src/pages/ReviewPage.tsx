import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getIncorrectWords } from '../services/userService';
import type { Vocabulary } from '../types/firestore.d';
import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

const ReviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incorrectWords, setIncorrectWords] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWords = async () => {
      if (currentUser) {
        try {
          const words = await getIncorrectWords(currentUser.uid);
          setIncorrectWords(words);
        } catch (error) {
          console.error("Failed to fetch incorrect words:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchWords();
  }, [currentUser]);

  const handleStartTest = () => {
    if (incorrectWords.length > 0) {
      navigate('/test', { state: { words: incorrectWords, testType: 'review' } });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading your review words...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Review Your Mistakes</h1>

        {incorrectWords.length > 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <FiRefreshCw className="text-blue-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">You have {incorrectWords.length} words to review.</h2>
            <p className="text-gray-600 mb-6">
              Let's go over the words you missed. You can test yourself to make sure you've mastered them.
            </p>
            <button
              onClick={handleStartTest}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Start Review Test
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Mistakes Found!</h2>
            <p className="text-gray-600">
              Great job! You haven't made any mistakes in your recent tests. Keep up the excellent work.
            </p>
          </div>
        )}

        {incorrectWords.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Words to Review:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {incorrectWords.map(word => (
                <div key={word.id} className="bg-white p-4 rounded-lg shadow">
                  <p className="font-bold text-lg">{word.kor}</p>
                  <p className="text-gray-600">{word.eng}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage; 
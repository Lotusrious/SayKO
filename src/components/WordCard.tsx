import React, { useState } from 'react';
import type { Vocabulary } from '@/types/firestore';
import { AiFillSound, AiOutlineLoading } from 'react-icons/ai';

interface WordCardProps {
  word: Vocabulary;
  index: number;
  isIncorrect: boolean;
  onWordClick: (word: string) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, index, isIncorrect, onWordClick }) => {
  const [isSoundLoading, setIsSoundLoading] = useState(false);
  const cardBgClass = isIncorrect ? 'bg-red-50' : 'bg-white';

  const handlePlaySound = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoundLoading) return;

    setIsSoundLoading(true);

    try {
      // 로컬 에뮬레이터 또는 배포된 함수 URL
      const functionUrl = `https://us-central1-sayko-f08c1.cloudfunctions.net/getTTSAudio`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word.kor }),
      });

      if (!response.ok) {
        throw new Error('Failed to get TTS audio from the function.');
      }

      const { audioContent } = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();

    } catch (error) {
      console.error("Error playing TTS audio:", error);
      alert("오디오 재생에 실패했습니다.");
    } finally {
      setIsSoundLoading(false);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer ${cardBgClass}`}
      onClick={() => onWordClick(word.kor)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 font-medium">{index}.</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{word.kor}</h3>
            {word.pronunciation && (
              <p className="text-sm text-gray-500">{word.pronunciation}</p>
            )}
          </div>
          <button onClick={handlePlaySound} className="text-gray-500 hover:text-blue-600" disabled={isSoundLoading}>
            {isSoundLoading ? <AiOutlineLoading className="animate-spin" size={22} /> : <AiFillSound size={22} />}
          </button>
        </div>
        <p className="text-lg text-gray-600 font-light">{word.eng}</p>
      </div>
    </div>
  );
};

export default WordCard; 
import React, { useState } from 'react';
import type { Vocabulary } from '@/types/firestore';
import Modal from './Modal';
import ExampleList from './ExampleList';
import { AiFillSound, AiOutlineLoading } from 'react-icons/ai';

interface WordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: Vocabulary | null;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ isOpen, onClose, word }) => {
  const [isSoundLoading, setIsSoundLoading] = useState(false);

  if (!word) {
    return null;
  }

  const handlePlaySound = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoundLoading || !word) return;

    setIsSoundLoading(true);

    try {
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
  
  const imageUrl = word.imageUrl || `https://source.unsplash.com/400x300/?${word.eng}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-2">
        <img src={imageUrl} alt={word.eng} className="w-full h-48 object-cover rounded-lg mb-4" />
        
        <div className="text-center mb-4">
          <div className="flex justify-center items-center space-x-2">
            <h2 className="text-3xl font-bold text-gray-800">{word.kor}</h2>
            <button onClick={handlePlaySound} className="text-gray-500 hover:text-blue-600" disabled={isSoundLoading}>
              {isSoundLoading ? <AiOutlineLoading className="animate-spin" size={24} /> : <AiFillSound size={24} />}
            </button>
          </div>
          <p className="text-xl text-gray-500 mt-1">{word.eng}</p>
          {word.partOfSpeech && (
            <p className="text-md text-gray-500 italic mt-1">({word.partOfSpeech})</p>
          )}
        </div>

        {word.examples && word.examples.length > 0 ? (
          <ExampleList
            examples={word.examples}
            wordToHighlight={word.kor}
            engWordToHighlight={word.eng}
          />
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p>No examples available.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WordDetailModal; 
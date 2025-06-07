import React from 'react';
import type { Vocabulary } from '@/types/firestore';
import ExampleList from './ExampleList';

interface WordCardProps {
  word: Vocabulary;
  index: number;
  onWordClick: (word: string) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, index, onWordClick }) => {
  return (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer"
      onClick={() => onWordClick(word.kor)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-baseline space-x-3">
          <span className="text-gray-400 font-medium">{index}.</span>
          <h3 className="text-xl font-semibold text-gray-800">{word.kor}</h3>
        </div>
        <p className="text-lg text-gray-600 font-light">{word.eng}</p>
      </div>
    </div>
  );
};

export default WordCard; 
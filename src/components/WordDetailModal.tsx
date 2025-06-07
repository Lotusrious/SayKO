import React from 'react';
import type { Vocabulary } from '@/types/firestore';
import Modal from './Modal';
import ExampleList from './ExampleList';

interface WordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: Vocabulary | null;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ isOpen, onClose, word }) => {
  if (!word) {
    return null;
  }

  // 임시 이미지 URL - 나중에 실제 이미지로 교체해야 합니다.
  const imageUrl = `https://source.unsplash.com/400x300/?${word.eng}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-2">
        <img src={imageUrl} alt={word.eng} className="w-full h-48 object-cover rounded-lg mb-4" />
        
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">{word.kor}</h2>
          <p className="text-xl text-gray-500 mt-1">{word.eng}</p>
        </div>

        {word.examples && word.examples.length > 0 && (
          <ExampleList
            examples={word.examples}
            wordToHighlight={word.kor}
            onWordClick={() => { /* 예문 속 단어 클릭은 여기서 처리 안 함 */ }}
          />
        )}
      </div>
    </Modal>
  );
};

export default WordDetailModal; 
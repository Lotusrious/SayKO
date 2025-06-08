import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Vocabulary } from '@/types/firestore';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './ImageCardPage.css';
import AlertModal from '@/components/AlertModal';

const ImageCardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // LearningPage에서 전달받은 오늘의 단어 목록
  const words = location.state?.words as Vocabulary[] || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const nodeRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (words.length === 0) {
    // 단어 데이터가 없으면 학습 페이지로 돌려보냄
    navigate('/learn');
    return null;
  }

  const handleCardClick = () => {
    if (!isRevealed) {
      // 카드를 뒤집어서 뜻을 보여줌
      setIsRevealed(true);
    } else {
      // 다음 카드로 넘어감
      if (currentIndex < words.length - 1) {
        setIsRevealed(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        // 마지막 카드였으면 모달을 엽니다.
        setIsModalOpen(true);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/learn'); // 모달이 닫히면 페이지 이동
  };

  const currentWord = words[currentIndex];
  // Firestore에 저장된 imageUrl을 직접 사용합니다.
  const imageUrl = currentWord.imageUrl;

  if (!imageUrl) {
    // imageUrl이 아직 없는 단어의 경우 (스크립트 실행 전 등)
    // 임시 이미지를 보여주거나 로딩 상태를 표시할 수 있습니다.
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <p>Loading image...</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-black min-h-screen flex flex-col items-center justify-center p-4 text-white"
      onClick={handleCardClick}
    >
      <SwitchTransition>
        <CSSTransition
          key={currentIndex}
          nodeRef={nodeRef}
          timeout={300}
          classNames="fade"
        >
          <div ref={nodeRef} className="w-full max-w-md text-center">
            {/* imageUrl을 src로 사용합니다. */}
            <img src={imageUrl} alt={currentWord.eng} className="w-full h-64 object-cover rounded-2xl shadow-lg mb-6" />
            
            <h2 className="text-4xl font-bold mb-4">{currentWord.kor}</h2>
            
            <div className="h-12 flex flex-col items-center justify-center">
              {isRevealed && (
                <div className="animate-fade-in">
                  <p className="text-2xl text-gray-300">{currentWord.eng}</p>
                  {currentWord.partOfSpeech && (
                    <p className="text-lg text-gray-400 italic mt-1">{currentWord.partOfSpeech}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CSSTransition>
      </SwitchTransition>
      
      <div className="absolute bottom-5 text-sm text-gray-500">
        {currentIndex + 1} / {words.length}
      </div>

      <AlertModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Congratulations!"
        message="You have completed today's image card learning."
      />
    </div>
  );
};

export default ImageCardPage; 
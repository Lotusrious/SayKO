import React from 'react';
import type { Example } from '../types/firestore';

interface ExampleListProps {
  examples: Example[];
  wordToHighlight: string; // 하이라이트할 단어 (한국어)
  engWordToHighlight: string; // 하이라이트할 단어 (영어)
}

const ExampleList: React.FC<ExampleListProps> = ({ examples, wordToHighlight, engWordToHighlight }) => {
  /**
   * 문장에서 특정 단어를 찾아 <strong> 태그로 감싸는 함수
   * @param sentence - 원본 문장
   * @param word - 하이라이트할 단어
   * @returns JSX.Element
   */
  const highlightWord = (sentence: string, word: string) => {
    // sentence 또는 word가 비어있거나 undefined인 경우를 방어합니다.
    if (!sentence || !word) {
      return sentence || ''; // 문장이 있으면 그대로, 없으면 빈 문자열 반환
    }
    
    try {
      const parts = sentence.split(new RegExp(`(${word})`, 'gi'));
      return (
        <span>
          {parts.map((part, index) =>
            part.toLowerCase() === word.toLowerCase() ? (
              <strong
                key={index}
                className="font-bold text-blue-600"
              >
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch (error) {
      // 정규 표현식 생성 중 오류가 발생할 경우를 대비 (예: word에 특수문자가 포함된 경우)
      console.error("Error creating RegExp:", error);
      return sentence; // 오류 발생 시 원본 문장 반환
    }
  };
  
  return (
    <div className="mt-4 space-y-3 text-gray-700">
      <h4 className="font-semibold text-md text-center">Examples:</h4>
      <ul className="space-y-4 text-center">
        {examples.map((ex, index) => (
          <li key={index}>
            <p className="font-light text-lg">{highlightWord(ex.kor, wordToHighlight)}</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{highlightWord(ex.eng, engWordToHighlight)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExampleList; 
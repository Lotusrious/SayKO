import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Vocabulary, Example } from '../types/firestore';

/**
 * Firestore의 'vocabularies' 컬렉션에서 모든 단어 목록을 가져와
 * 앱에서 사용하기 위한 표준 Vocabulary 객체 배열로 변환합니다.
 * 학습 우선순위(priority)가 낮은 순서대로 정렬하여 반환합니다.
 * 
 * @returns {Promise<Vocabulary[]>} 정렬 및 변환된 단어 객체 배열을 반환하는 프로미스.
 * @throws {Error} 데이터 조회 또는 변환 중 에러 발생 시 에러를 던집니다.
 */
export const getVocabularies = async (): Promise<Vocabulary[]> => {
  const vocabularies: Vocabulary[] = [];
  const q = query(collection(db, 'vocabularies'), orderBy('priority', 'asc'));

  try {
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      let engMeaning: string = '';

      if (typeof data.meaning === 'object' && data.meaning !== null && data.meaning.eng) {
        engMeaning = data.meaning.eng;
      } else if (typeof data.meaning === 'string') {
        engMeaning = data.meaning;
      } else if (typeof data.meaning === 'object' && data.meaning !== null) {
        engMeaning = data.meaning.en || '';
      }

      const rawExamples = data.examples || data.sentences || [];
      const examples: Example[] = rawExamples
        .map((ex: any) => ({
          kor: ex.kor || ex.sentence_ko || '',
          eng: ex.eng || ex.sentence_en || '',
        }))
        .filter((ex: Example) => ex.kor);

      const vocabulary: Vocabulary = {
        id: doc.id,
        kor: data.word || '',
        eng: engMeaning,
        priority: data.priority ?? 99,
        pronunciation: data.pronunciation || '',
        category: data.category || '',
        examples: examples,
      };
      
      vocabularies.push(vocabulary);
    });

    return vocabularies;
  } catch (error) {
    console.error('Error fetching vocabularies: ', error);
    throw new Error('Failed to fetch and transform vocabularies from Firestore.');
  }
}; 
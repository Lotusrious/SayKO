import admin from 'firebase-admin';
import { readFileSync } from 'fs';

/**
 * 이 스크립트는 Firestore 'vocabularies' 컬렉션에서
 * 'imageUrl' 필드가 없거나 비어 있는 단어의 목록을 가져와
 * JSON 형식으로 콘솔에 출력합니다.
 */

// Firebase Admin SDK 초기화
try {
  const serviceAccountPath = './sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json';
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Firebase 서비스 계정 파일(sayko-f08c1-...)을 읽는 데 실패했습니다.', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * 이미지가 없는 단어 목록을 콘솔에 출력하는 메인 함수
 */
async function listWordsWithoutImages() {
  console.log('이미지 URL이 아직 없는 단어를 Firestore에서 가져오는 중...');
  
  try {
    const vocabulariesRef = db.collection('vocabularies');
    const snapshot = await vocabulariesRef.get();

    if (snapshot.empty) {
      console.log('어휘 데이터베이스에서 단어를 찾을 수 없습니다.');
      return;
    }

    const wordsToUpdate = [];
    snapshot.forEach(doc => {
      const wordData = doc.data();
      const englishWord = typeof wordData.meaning === 'string'
        ? wordData.meaning
        : (wordData.meaning?.eng || wordData.meaning?.en);

      // 'imageUrl' 필드가 없거나, null이거나, 빈 문자열인 경우
      if (!wordData.imageUrl && englishWord) {
        wordsToUpdate.push({
          id: doc.id,
          eng: englishWord
        });
      }
    });

    if (wordsToUpdate.length > 0) {
      console.log(`총 ${wordsToUpdate.length}개의 단어에 이미지가 필요합니다.`);
      // 다른 프로세스에서 쉽게 사용할 수 있도록 순수 JSON으로 출력
      console.log(JSON.stringify(wordsToUpdate, null, 2));
    } else {
      console.log('모든 단어에 이미지 URL이 있습니다! 작업이 필요 없습니다.');
    }

  } catch (error) {
    console.error('Firestore에서 단어를 가져오는 중 오류가 발생했습니다.', error);
  }
}

// 스크립트 실행
listWordsWithoutImages(); 
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서비스 계정 키 파일을 읽어옵니다.
const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();

async function addMissingWords() {
  try {
    console.log('단어 데이터 동기화 작업을 시작합니다...');

    // 1. 원본 단어 파일 읽기
    const sourceWordsPath = path.resolve(__dirname, '../src/data/initialWords.json');
    const sourceWordsArray = JSON.parse(readFileSync(sourceWordsPath, 'utf-8'));
    const sourceWords = new Set(sourceWordsArray);
    console.log(`- 원본 데이터에서 ${sourceWords.size}개의 단어를 로드했습니다.`);

    // 2. Firestore에서 현재 단어 가져오기
    const existingWords = new Set();
    const snapshot = await db.collection('vocabularies').get();
    snapshot.forEach(doc => {
      existingWords.add(doc.data().word);
    });
    console.log(`- Firestore에서 ${existingWords.size}개의 단어를 로드했습니다.`);

    // 3. 누락된 단어 찾기
    const missingWords = [];
    for (const word of sourceWords) {
      if (!existingWords.has(word)) {
        missingWords.push(word);
      }
    }

    if (missingWords.length === 0) {
      console.log('🎉 모든 단어가 이미 동기화되어 있습니다. 추가할 단어가 없습니다.');
      return;
    }

    console.log(`- ${missingWords.length}개의 누락된 단어를 찾았습니다. 업로드를 시작합니다...`);

    // 4. 누락된 단어 추가
    const batch = db.batch();
    const collectionRef = db.collection('vocabularies');
    
    missingWords.forEach(word => {
      const docRef = collectionRef.doc(); // Firestore가 자동으로 ID 생성
      batch.set(docRef, {
        word: word,
        createdAt: Timestamp.now(),
        status: 'new',
        correctCount: 0,
        incorrectCount: 0,
        partOfSpeech: '',
        lastReviewed: null,
        nextReviewDate: Timestamp.now(),
      });
    });

    await batch.commit();

    console.log(`✅ 성공적으로 ${missingWords.length}개의 단어를 Firestore에 추가했습니다.`);
    
    const finalCountSnapshot = await db.collection('vocabularies').get();
    console.log(`- 현재 총 단어 수: ${finalCountSnapshot.size}개`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류가 발생했습니다:', error);
  }
}

addMissingWords(); 
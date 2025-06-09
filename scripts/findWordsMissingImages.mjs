import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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

async function findWordsMissingImages() {
  try {
    console.log('이미지가 없는 단어를 찾는 중입니다...');

    const snapshot = await db.collection('vocabularies').get();
    const wordsMissingImage = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // imageUrl 필드가 없거나, 있더라도 빈 문자열인 경우
      if (!data.imageUrl) {
        wordsMissingImage.push(data.word);
      }
    });

    if (wordsMissingImage.length === 0) {
      console.log('🎉 모든 단어에 이미지가 할당되어 있습니다.');
    } else {
      console.log(`- 총 ${wordsMissingImage.length}개의 단어에 이미지가 없습니다:`);
      wordsMissingImage.forEach(word => console.log(`  - ${word}`));
    }
    
    console.log(`\n(총 문서: ${snapshot.size}개)`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류가 발생했습니다:', error);
  }
}

findWordsMissingImages(); 
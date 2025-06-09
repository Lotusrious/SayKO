import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();

async function findNonStorageImages() {
  try {
    console.log('Firebase Storage에 없는 이미지 URL을 찾는 중입니다...');

    const snapshot = await db.collection('vocabularies').get();
    const nonStorageImages = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.imageUrl && !data.imageUrl.includes('firebasestorage.googleapis.com')) {
        nonStorageImages.push({ word: data.word, url: data.imageUrl });
      }
    });

    if (nonStorageImages.length === 0) {
      console.log('🎉 모든 이미지 URL이 Firebase Storage를 사용하고 있습니다.');
    } else {
      console.log(`- 총 ${nonStorageImages.length}개의 이미지가 Firebase Storage에 없습니다:`);
      nonStorageImages.forEach(item => console.log(`  - ${item.word}: ${item.url}`));
    }

    console.log(`\n(총 문서: ${snapshot.size}개)`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류가 발생했습니다:', error);
  }
}

findNonStorageImages(); 
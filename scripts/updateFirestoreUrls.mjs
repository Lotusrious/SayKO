import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin SDK 초기화
const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'sayko-f08c1.firebasestorage.app'
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

async function updateAllFirestoreUrlsCorrectly() {
  console.log('Firestore의 모든 단어에 대해 imageUrl 업데이트를 시작합니다 (인코딩 수정 버전)...');
  
  const snapshot = await db.collection('vocabularies').get();
  const promises = [];
  let successCount = 0;
  let errorCount = 0;

  console.log(`총 ${snapshot.size}개의 단어를 처리합니다.`);
  console.log('================================================================');

  for (const doc of snapshot.docs) {
    const wordData = doc.data();
    const word = wordData.word;
    const docId = doc.id;

    try {
      // ❗️ 가장 중요한 수정: 파일 경로를 URL 인코딩합니다.
      const encodedWord = encodeURIComponent(word);
      const filePath = `word_images/${encodedWord}.webp`;
      const file = bucket.file(filePath);

      // 파일 존재 여부를 먼저 확인합니다.
      const [exists] = await file.exists();

      if (exists) {
        // 파일이 존재하면 공개 URL을 생성합니다.
        // 이미 파일이 있으므로, URL만 생성하여 DB를 업데이트합니다.
        // 파일을 다시 공개로 만들 필요는 없습니다 (한 번이면 충분).
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/word_images/${encodedWord}.webp`;

        const docRef = db.collection('vocabularies').doc(docId);
        promises.push(docRef.update({ imageUrl: publicUrl }));
        successCount++;
      } else {
        console.warn(`[경고] Storage에 "${word}"에 대한 파일이 없습니다. (인코딩된 경로: ${filePath})`);
        errorCount++;
      }
    } catch (error) {
      console.error(`[에러] "${word}" (ID: ${docId}) 처리 중 오류 발생:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`- ${successCount}개의 URL을 생성하여 업데이트를 준비합니다.`);
  console.log(`- ${errorCount}개의 단어는 Storage에 파일이 없어 건너뜁니다.`);
  console.log('================================================================');
  
  if (promises.length > 0) {
      console.log('모든 URL 생성 완료. Firestore에 일괄 업데이트를 시작합니다...');
      await Promise.all(promises);
      console.log('✨ 모든 작업이 완료되었습니다.');
  } else {
      console.log('업데이트할 내용이 없습니다.');
  }
  
  console.log(`- 최종 성공: ${successCount}건`);
  console.log(`- 최종 실패/누락: ${errorCount}건`);
}

updateAllFirestoreUrlsCorrectly().catch(console.error); 
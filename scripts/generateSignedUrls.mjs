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

async function generateSignedUrlsAndupdateDB() {
  console.log('모든 이미지에 대해 다운로드 토큰이 포함된 URL을 생성하고 DB를 업데이트합니다...');
  
  const snapshot = await db.collection('vocabularies').get();
  let successCount = 0;
  let errorCount = 0;
  const updatePromises = [];

  // URL 유효 기간 설정 (100년 후)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 100);

  console.log(`총 ${snapshot.size}개의 단어를 처리합니다.`);
  console.log('----------------------------------------------------');

  for (const doc of snapshot.docs) {
    const word = doc.data().word;
    const docId = doc.id;

    try {
      const encodedWord = encodeURIComponent(word);
      const filePath = `word_images/${encodedWord}.webp`;
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        console.warn(`[경고] Storage에 "${word}" 파일이 없습니다. 건너뜁니다.`);
        errorCount++;
        continue;
      }
      
      // 서명된 URL 생성
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expirationDate,
      });

      // Firestore 업데이트 준비
      const docRef = db.collection('vocabularies').doc(docId);
      updatePromises.push(docRef.update({ imageUrl: signedUrl }));
      successCount++;

    } catch (error) {
      console.error(`[에러] "${word}" 처리 중 오류 발생:`, error.message);
      errorCount++;
    }
  }

  if (updatePromises.length > 0) {
    console.log(`\n총 ${successCount}개의 서명된 URL 생성을 완료했습니다.`);
    console.log('이제 Firestore에 일괄적으로 업데이트합니다...');
    await Promise.all(updatePromises);
    console.log('✨ DB 업데이트 완료!');
  } else {
    console.log('업데이트할 URL이 없습니다.');
  }

  console.log('----------------------------------------------------');
  console.log('모든 작업이 완료되었습니다.');
  console.log(`- 최종 성공: ${successCount}건`);
  console.log(`- 최종 실패: ${errorCount}건`);

  if(errorCount === 0) {
      console.log('\n이제 정말로 이미지가 보여야 합니다. 확인 부탁드립니다!');
  }
}

generateSignedUrlsAndupdateDB().catch(console.error); 
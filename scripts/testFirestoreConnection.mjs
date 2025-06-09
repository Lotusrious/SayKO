import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// 서비스 계정 키 파일 경로
const serviceAccountPath = '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json';

try {
  console.log(`서비스 계정 키 파일을 다음 경로에서 읽습니다: ${new URL(serviceAccountPath, import.meta.url)}`);
  const serviceAccount = JSON.parse(readFileSync(new URL(serviceAccountPath, import.meta.url)));

  // Firebase Admin SDK 초기화
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = getFirestore();
  console.log('Firebase Admin SDK가 성공적으로 초기화되었습니다.');
  console.log('Firestore에 연결하여 "words" 컬렉션의 문서 개수를 확인합니다...');

  const testConnection = async () => {
    try {
      const wordsCollection = db.collection('words');
      const snapshot = await wordsCollection.get();

      if (snapshot.empty) {
        console.log('❌ "words" 컬렉션을 찾았지만, 문서가 하나도 없습니다.');
      } else {
        console.log(`✅ 성공! "words" 컬렉션에서 ${snapshot.size}개의 문서를 찾았습니다.`);
      }
    } catch (error) {
      console.error('❌ Firestore에서 데이터를 읽어오는 중 오류가 발생했습니다:', error);
    }
  };

  testConnection();

} catch (error) {
    if (error.code === 'ENOENT') {
        console.error('❌ 서비스 계정 키 파일을 찾을 수 없습니다.');
        console.error(`오류: ${serviceAccountPath} 경로에 파일이 있는지 확인해주세요.`);
    } else {
        console.error('❌ 스크립트 실행 중 심각한 오류가 발생했습니다:', error);
    }
} 
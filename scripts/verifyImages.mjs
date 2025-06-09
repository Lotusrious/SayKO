import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// --- 스크립트 설정 및 초기화 ---

// Firebase Admin SDK 초기화
// 이미 초기화된 앱이 있으면 사용하고, 없으면 새로 초기화합니다.
if (!admin.apps.length) {
  try {
    const serviceAccountPath = './sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json';
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase 서비스 계정 파일을 읽거나 초기화하는 데 실패했습니다.', error);
    process.exit(1);
  }
}

const db = admin.firestore();

// --- 메인 로직 ---

/**
 * 모든 단어를 스캔하여 이미지 URL이 없는 단어를 찾아 출력합니다.
 */
async function verifyImages() {
  console.log('이미지 누락 최종 검증을 시작합니다...');

  let missingWords = [];
  try {
    const snapshot = await db.collection('vocabularies').get();
    
    if (snapshot.empty) {
      console.log('어휘 데이터베이스에서 단어를 찾을 수 없습니다.');
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      // imageUrl 필드가 없거나(undefined), null이거나, 빈 문자열인 경우를 모두 확인합니다.
      if (!data.imageUrl) {
        const eng = typeof data.meaning === 'string' ? data.meaning : (data.meaning?.eng || data.meaning?.en);
        missingWords.push({ id: doc.id, eng: eng || 'N/A' });
      }
    });

  } catch (error) {
    console.error('Firestore에서 단어 목록을 가져오는 중 오류 발생:', error);
    return;
  }
  
  console.log('\n--- 검증 완료 ---');
  if (missingWords.length === 0) {
    console.log('🎉 완벽합니다! 모든 단어에 이미지가 있습니다.');
  } else {
    console.log(`🚨 발견: ${missingWords.length}개의 단어에 이미지가 없습니다.`);
    console.log('해당 단어 목록:');
    console.table(missingWords);
  }
  console.log('-----------------');
}

// 스크립트 실행
verifyImages(); 
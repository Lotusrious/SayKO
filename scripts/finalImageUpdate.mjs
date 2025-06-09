import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import FirecrawlApp from '@mendable/firecrawl-js';

// --- 스크립트 설정 및 초기화 ---

// 1. Firecrawl API 키를 명령줄 인자에서 가져옵니다.
const apiKey = process.argv[2];
if (!apiKey) {
  console.error('오류: Firecrawl API 키가 필요합니다.');
  console.error('사용법: node scripts/finalImageUpdate.mjs <YOUR_FIRECRAWL_API_KEY>');
  process.exit(1);
}

// 2. Firebase Admin SDK 초기화
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
const app = new FirecrawlApp({ apiKey });

// --- 헬퍼 함수 ---

/**
 * 작업을 n 밀리초 동안 일시 중지합니다. API 속도 제한을 피하기 위해 사용됩니다.
 * @param {number} ms - 일시 중지할 시간 (밀리초).
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 메인 로직 ---

/**
 * Firestore의 모든 단어를 가져와 이미지가 없는 단어의 이미지 URL을 업데이트합니다.
 */
async function updateAllWordImages() {
  console.log('이미지 URL이 없는 단어를 Firestore에서 가져오는 중...');
  
  let wordsToUpdate;
  try {
    const vocabulariesRef = db.collection('vocabularies');
    const snapshot = await vocabulariesRef.get();

    if (snapshot.empty) {
      console.log('어휘 데이터베이스에서 단어를 찾을 수 없습니다.');
      return;
    }

    wordsToUpdate = [];
    snapshot.forEach(doc => {
      const wordData = doc.data();
      const englishWord = typeof wordData.meaning === 'string'
        ? wordData.meaning
        : (wordData.meaning?.eng || wordData.meaning?.en);

      if (!wordData.imageUrl && englishWord) {
        wordsToUpdate.push({
          id: doc.id,
          eng: englishWord
        });
      }
    });

  } catch (error) {
    console.error('Firestore에서 단어를 가져오는 중 오류가 발생했습니다.', error);
    return;
  }

  console.log(`총 ${wordsToUpdate.length}개의 단어에 대한 이미지를 업데이트해야 합니다.`);
  if (wordsToUpdate.length === 0) {
    console.log('모든 단어에 이미 이미지가 있습니다.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // 각 단어에 대해 순차적으로 이미지 URL을 가져와서 업데이트합니다.
  for (let i = 0; i < wordsToUpdate.length; i++) {
    const word = wordsToUpdate[i];
    const progress = `(${i + 1}/${wordsToUpdate.length})`;
    console.log(`${progress} '${word.eng}' 단어의 이미지 처리 중...`);

    try {
      const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(word.eng)}`;
      
      const scrapeResult = await app.scrapeUrl(unsplashUrl, {
        formats: ['links'],
        onlyMainContent: true,
      });

      const imageUrl = scrapeResult.links.find(link => link.includes('/download?'));

      if (imageUrl) {
        await db.collection('vocabularies').doc(word.id).update({ imageUrl });
        console.log(`  => 성공: '${word.eng}'의 이미지를 업데이트했습니다.`);
        successCount++;
      } else {
        console.log(`  => 실패: '${word.eng}'에 대한 이미지를 찾지 못했습니다.`);
        failCount++;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of null") || error.message.includes("undefined (reading 'find')")) {
         console.log(`  => 실패: '${word.eng}'에 대한 스크래핑 결과가 없거나 링크를 찾을 수 없습니다.`);
      } else {
         console.error(`  => 오류: '${word.eng}' 처리 중 오류 발생:`, error.message);
      }
      failCount++;
    }

    // API 속도 제한을 피하기 위해 각 요청 사이에 2초 대기합니다.
    await sleep(2000);
  }

  console.log('\n--- 작업 완료 ---');
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log('-----------------');
}

// --- 스크립트 실행 ---
updateAllWordImages(); 
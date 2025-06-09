import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import OpenAI from 'openai';

// --- 스크립트 설정 및 초기화 ---

// 1. OpenAI API 키를 명령줄 인자에서 가져옵니다.
const apiKey = process.argv[2];
if (!apiKey) {
  console.error('오류: OpenAI API 키가 필요합니다.');
  console.error('사용법: node scripts/generateImages.mjs <YOUR_OPENAI_API_KEY>');
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
const openai = new OpenAI({ apiKey });

// --- 헬퍼 함수 ---

/**
 * 작업을 n 밀리초 동안 일시 중지합니다. API 속도 제한을 피하기 위해 사용됩니다.
 * @param {number} ms - 대기할 시간 (밀리초)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 메인 로직 ---

/**
 * 이미지가 없는 단어를 찾아 OpenAI DALL-E로 이미지를 생성하고 DB를 업데이트합니다.
 */
async function generateMissingImages() {
  console.log('OpenAI 이미지 생성 작업을 시작합니다...');

  let wordsToUpdate = [];
  try {
    const snapshot = await db.collection('vocabularies').get();
    if (snapshot.empty) {
      console.log('어휘 데이터베이스에서 단어를 찾을 수 없습니다.');
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.imageUrl) {
        const eng = typeof data.meaning === 'string' ? data.meaning : (data.meaning?.eng || data.meaning?.en);
        if (eng) {
          wordsToUpdate.push({ id: doc.id, eng });
        }
      }
    });

  } catch (error) {
    console.error('Firestore에서 단어 목록을 가져오는 중 오류 발생:', error);
    return;
  }
  
  if (wordsToUpdate.length === 0) {
      console.log('이미지가 없는 단어가 없습니다. 작업을 종료합니다.');
      return;
  }

  console.log(`총 ${wordsToUpdate.length}개의 단어에 대한 이미지 생성을 시작합니다.`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < wordsToUpdate.length; i++) {
    const word = wordsToUpdate[i];
    
    console.log(`[${i + 1}/${wordsToUpdate.length}] "${word.eng}" 이미지 생성 중...`);

    try {
      const prompt = `A simple, clean, high-quality photograph of "${word.eng}". Realistic, centered, plain background.`;
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0].url;

      if (imageUrl) {
        await db.collection('vocabularies').doc(word.id).update({ imageUrl });
        console.log(`  -> "${word.eng}" (ID: ${word.id}) 이미지 생성 및 업데이트 성공!`);
        successCount++;
      } else {
        console.log(`  -> "${word.eng}" 이미지 URL을 받지 못했습니다.`);
        failureCount++;
      }

    } catch (error) {
      console.error(`  -> "${word.eng}" 이미지 생성 중 오류 발생: ${error.message}`);
      failureCount++;
    }
    
    // API 속도 제한을 피하기 위해 요청 사이에 잠시 대기합니다.
    await sleep(5000); // DALL-E API는 요청 간격이 필요할 수 있습니다.
  }

  console.log('\n--- 작업 완료 ---');
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failureCount}개`);
  console.log('-----------------');
}

// 스크립트 실행
generateMissingImages().catch(console.error); 
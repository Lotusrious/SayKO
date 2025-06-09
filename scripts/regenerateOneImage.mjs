import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import OpenAI from 'openai';

// --- 스크립트 설정 및 초기화 ---

// 1. 필요한 인자들을 명령줄에서 가져옵니다.
const apiKey = process.argv[2];
const docId = process.argv[3];
const prompt = process.argv[4];

if (!apiKey || !docId || !prompt) {
  console.error('오류: 모든 인자가 필요합니다.');
  console.error('사용법: node scripts/regenerateOneImage.mjs <API_KEY> <단어_ID> "<프롬프트>"');
  console.error('예시: node scripts/regenerateOneImage.mjs sk-... 벗다 "A person taking off a jacket"');
  process.exit(1);
}

// 2. Firebase Admin SDK 초기화
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
const openai = new OpenAI({ apiKey });

// --- 메인 로직 ---

/**
 * 지정된 단어 ID에 대해 새 이미지를 생성하고 Firestore 문서를 업데이트합니다.
 */
async function regenerateImage() {
  console.log(`'${docId}' 단어에 대한 이미지 재생성을 시작합니다...`);
  console.log(`사용할 프롬프트: "${prompt}"`);

  try {
    const fullPrompt = `A simple, clean, high-quality photograph of '${prompt}'. Realistic, centered, plain background.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0].url;

    if (imageUrl) {
      await db.collection('vocabularies').doc(docId).update({ imageUrl });
      console.log(`✅ 성공: '${docId}' 단어의 이미지를 성공적으로 교체했습니다.`);
      console.log(`   새 이미지 URL: ${imageUrl}`);
    } else {
      console.error('❌ 실패: OpenAI로부터 이미지 URL을 받지 못했습니다.');
    }

  } catch (error) {
    console.error(`❌ 실패: 이미지 생성 또는 업데이트 중 오류 발생: ${error.message}`);
  }
}

// 스크립트 실행
regenerateImage(); 
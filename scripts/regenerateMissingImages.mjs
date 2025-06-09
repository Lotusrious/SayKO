import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드 시도
config({ path: path.resolve(__dirname, '../.env') });

const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Pexels에서 이미지 검색
async function searchImagePexels(query) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!response.ok) throw new Error(`Pexels API 에러: ${response.statusText}`);
    const data = await response.json();
    return data.photos && data.photos.length > 0 ? data.photos[0].src.original : null;
  } catch (error) {
    console.warn(`  ⚠️ Pexels 검색 실패: ${query}`, error.message);
    return null;
  }
}

// DALL-E 3로 이미지 생성
async function generateImageDallE(prompt) {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `A clear, simple, high-quality photograph representing the concept of '${prompt}', minimalist style`,
        n: 1,
        size: '1024x1024',
      }),
    });
    if (!response.ok) {
        const errBody = await response.json();
        throw new Error(`OpenAI API 에러: ${response.statusText} - ${JSON.stringify(errBody)}`);
    }
    const data = await response.json();
    return data.data && data.data.length > 0 ? data.data[0].url : null;
  } catch (error) {
    console.error(`  ❌ DALL-E 생성 실패: ${prompt}`, error.message);
    return null;
  }
}

async function regenerateImages() {
  console.log('Pexels 또는 DALL-E를 사용하여 이미지가 필요한 단어의 이미지를 재생성합니다...');

  if (!PEXELS_API_KEY && !OPENAI_API_KEY) {
    console.error('❌ .env 파일에 PEXELS_API_KEY 또는 OPENAI_API_KEY가 없습니다. 둘 중 하나는 필수입니다.');
    return;
  }
  
  const vocabulariesRef = db.collection('vocabularies');
  const snapshot = await vocabulariesRef.get();
  
  const wordsToProcess = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.imageUrl && !data.imageUrl.includes('firebasestorage.googleapis.com')) {
        wordsToProcess.push({ id: doc.id, ...data });
    }
  });

  if (wordsToProcess.length === 0) {
    console.log('🎉 이미지 재생성이 필요한 단어가 없습니다.');
    return;
  }

  console.log(`- 총 ${snapshot.size}개의 단어 중, ${wordsToProcess.length}개의 이미지를 재생성합니다.`);

  let processedCount = 0;
  for (const wordDoc of wordsToProcess) {
    const { id, word, meaning } = wordDoc;
    console.log(`[${processedCount + 1}/${wordsToProcess.length}] 처리 중: ${word}`);

    let newImageUrl;
    if (PEXELS_API_KEY) {
      newImageUrl = await searchImagePexels(word) || await searchImagePexels(meaning.en);
    }
    
    if (!newImageUrl && OPENAI_API_KEY) {
        console.log(`  - Pexels에서 '${word}' 이미지를 찾지 못해 DALL-E로 생성합니다.`);
        newImageUrl = await generateImageDallE(word);
    }

    if (newImageUrl) {
      await vocabulariesRef.doc(id).update({
        imageUrl: newImageUrl,
        imageUpdatedAt: Timestamp.now(),
      });
      console.log(`  ✅ 성공: ${word}의 새 이미지 URL로 업데이트했습니다.`);
    } else {
      console.error(`  ❌ 실패: ${word}의 이미지를 찾거나 생성하지 못했습니다.`);
    }
    processedCount++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 작업 완료! 총 ${processedCount}개의 단어를 처리했습니다.`);
}

regenerateImages();
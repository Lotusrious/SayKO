import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
config({ path: path.resolve(__dirname, '../.env') });

const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Firecrawl을 사용하여 이미지 검색
async function scrapeImage(query, source) {
  let url;
  if (source === 'unsplash') {
    url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  } else if (source === 'pexels') {
    url = `https://www.pexels.com/search/${encodeURIComponent(query)}/`;
  } else {
    return null;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: url,
        pageOptions: {
          screenshot: false,
        },
        extractorOptions: {
          mode: 'llm-extraction',
          extractionPrompt: 'Based on the user query, find the most relevant and high-quality image URL. Return only the image source URL.',
          extractionSchema: {
            type: 'object',
            properties: {
              image_url: { type: 'string' },
            },
            required: ['image_url'],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Firecrawl API 에러: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    const result = await response.json();
    return result.data.image_url || null;

  } catch (error) {
    console.warn(`  ⚠️ ${source} 스크래핑 실패: ${query}`, error.message);
    return null;
  }
}

async function regenerateImages() {
  console.log('오래된/잘못된 URL을 가진 단어의 이미지를 스크래핑하여 재생성합니다...');

  if (!FIRECRAWL_API_KEY) {
    console.error('❌ .env 파일에 FIRECRAWL_API_KEY가 없습니다.');
    return;
  }
  
  const snapshot = await db.collection('vocabularies').get();
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

  console.log(`- 총 ${wordsToProcess.length}개의 단어 이미지를 재생성합니다.`);

  let processedCount = 0;
  for (const wordDoc of wordsToProcess) {
    const { id, word } = wordDoc;
    console.log(`[${processedCount + 1}/${wordsToProcess.length}] 처리 중: ${word}`);

    let newImageUrl = await scrapeImage(word, 'unsplash') || await scrapeImage(word, 'pexels');

    if (newImageUrl) {
      await db.collection('vocabularies').doc(id).update({
        imageUrl: newImageUrl,
        imageUpdatedAt: Timestamp.now(),
      });
      console.log(`  ✅ 성공: ${word}의 새 이미지 URL로 업데이트했습니다.`);
    } else {
      console.error(`  ❌ 실패: ${word}의 이미지를 찾거나 생성하지 못했습니다.`);
    }
    processedCount++;
    // API 속도 제한을 피하기 위해 약간의 딜레이 추가
    await new Promise(resolve => setTimeout(resolve, 4000)); 
  }

  console.log(`\n🎉 작업 완료! 총 ${processedCount}개의 단어를 처리했습니다.`);
}

regenerateImages(); 
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { OpenAI } from 'openai';
import { createApi } from 'unsplash-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// --- 설정 ---
// 중요: 이 스크립트를 실행하기 전에 .env 파일을 생성하고 아래 키들을 추가해야 합니다.
// OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
// UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxx

// .json 서비스 계정 키 파일을 직접 읽어옵니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .json 파일이 프로젝트 루트에 있다고 가정합니다.
const serviceAccountKeyPath = path.join(__dirname, '..', 'sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');
const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

// OpenAI로 생성할 단어 목록 (추상적이거나, Unsplash로 찾기 어려운 단어들)
const ABSTRACT_WORDS = [
  'happy', 'sad', 'love', 'angry', 'miss', 'think', 'learn', 'teach',
  // 여기에 더 추가할 수 있습니다.
];

// --- Firebase 초기화 ---
// fs.readFileSync를 사용하여 JSON 파일을 동기적으로 읽어옵니다.
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const db = getFirestore();
const storage = getStorage().bucket();
console.log('Firebase 초기화 완료.');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  // fetch: nodeFetch, // node-fetch가 있다면 추가
});

// --- Helper 함수 구현 ---

/**
 * Unsplash에서 이미지를 검색하고 첫 번째 이미지의 URL을 반환합니다.
 * @param {string} query - 검색할 단어
 * @returns {Promise<string>} 이미지 URL
 */
async function searchUnsplashImage(query) {
  try {
    const result = await unsplash.search.getPhotos({
      query: query,
      page: 1,
      perPage: 1,
      orientation: 'landscape',
    });

    if (result.errors) {
      console.error('[Unsplash] API 오류:', result.errors[0]);
      return null;
    }
    
    if (result.response.results.length > 0) {
      return result.response.results[0].urls.regular;
    } else {
      console.log(`[Unsplash] '${query}'에 대한 검색 결과가 없습니다.`);
      return null;
    }
  } catch (error) {
    console.error(`[Unsplash] API 호출 중 오류 발생 (단어: ${query}):`, error.message);
    return null;
  }
}

/**
 * OpenAI DALL-E 3로 이미지를 생성하고 Firebase Storage에 업로드한 후,
 * 공개 URL을 반환합니다.
 * @param {string} englishWord - 이미지를 생성할 영어 단어
 * @returns {Promise<string>} Firebase Storage에 저장된 이미지의 공개 URL
 */
async function generateAndUploadImage(englishWord) {
  try {
    // 1. DALL-E 3 API로 이미지 생성 요청
    console.log(`   - DALL-E API 호출: '${englishWord}'`);
    const prompt = `A minimalist, simple, flat vector illustration of '${englishWord}'. Clean background, vibrant colors, clear subject.`;
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url', // 임시 URL로 받음
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const tempImageUrl = response.data.data[0].url;
    
    // 2. 생성된 이미지 데이터를 버퍼로 다운로드
    console.log(`   - 이미지 다운로드 중...`);
    const imageResponse = await axios.get(tempImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    // 3. Firebase Storage에 이미지 업로드
    const fileName = `generated_images/${englishWord.replace(/\s+/g, '_')}_${Date.now()}.png`;
    const file = storage.file(fileName);

    console.log(`   - Firebase Storage에 업로드 중: ${fileName}`);
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });
    
    // 4. 업로드된 파일의 공개 URL 가져오기
    const [publicUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // 사실상 영구적인 URL
    });

    return publicUrl;

  } catch (error) {
    console.error(`[OpenAI] DALL-E 이미지 생성/업로드 중 오류 발생 (단어: ${englishWord}):`, error.response?.data || error.message);
    throw error;
  }
}

// 단어 번역 헬퍼 함수
async function translateWord(koreanWord) {
  if (!koreanWord || typeof koreanWord !== 'string') {
    return null;
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that translates a single Korean word into a single, common English word. Only output the English word itself, with no extra text or punctuation.',
        },
        { role: 'user', content: koreanWord },
      ],
      temperature: 0,
    });
    const translation = response.choices[0].message.content.trim();
    return translation;
  } catch (error) {
    console.error(`[FAIL] '${koreanWord}' 번역 중 OpenAI API 오류 발생:`, error);
    return null;
  }
}

async function getImageUrl(wordEng, wordKor) {
  if (ABSTRACT_WORDS.includes(wordEng)) {
    return await generateAndUploadImage(wordEng);
  } else {
    return await searchUnsplashImage(wordEng);
  }
}

// --- 메인 로직 ---
async function updateAllImages() {
  console.log('--- 단어 번역 및 이미지 URL 업데이트 작업을 시작합니다 ---');
  const db = getFirestore();
  const vocabCollection = db.collection('vocabularies');
  let translatedCount = 0;
  let imageUpdatedCount = 0;

  try {
    const snapshot = await vocabCollection.get();
    const words = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));

    console.log(`총 ${words.length}개의 단어를 스캔합니다. 작업이 완료될 때까지 기다려 주세요...`);

    for (const word of words) {
      const wordKor = word.word;
      let wordEng = word.meaning; // let으로 변경

      if (!wordKor || typeof wordKor !== 'string') {
        console.log(`[SKIP] ID: ${word.docId}에 'word' 필드가 없거나 유효하지 않아 건너뜁니다.`);
        continue;
      }
      
      // 1. meaning 필드가 비어있으면 번역하고 업데이트
      if (!wordEng || typeof wordEng !== 'string') {
        const translatedEng = await translateWord(wordKor);
        if (translatedEng) {
          wordEng = translatedEng;
          try {
            await vocabCollection.doc(word.docId).update({ meaning: translatedEng });
            translatedCount++;
          } catch (dbError) {
            console.error(`[DB FAIL] ID: ${word.docId}의 meaning 필드 업데이트 실패:`, dbError);
            continue; // DB 업데이트 실패 시 다음 단어로 넘어감
          }
        } else {
          console.warn(`[WARN] '${wordKor}' 단어 번역에 실패하여 건너뜁니다.`);
          continue; // 번역 실패 시 다음 단어로 넘어감
        }
      }

      // 2. imageUrl이 없으면 이미지 생성
      if (word.imageUrl) {
        console.log(`[SKIP] '${wordKor}' (${wordEng}) 단어는 이미 imageUrl이 있습니다.`);
        continue;
      }

      const imageUrl = await getImageUrl(wordEng, wordKor);

      if (imageUrl) {
        await vocabCollection.doc(word.docId).update({ imageUrl });
        imageUpdatedCount++;
      } else {
        console.warn(`[WARN] '${wordKor}'의 이미지를 찾거나 생성하지 못했습니다.`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\\n--- 작업 완료 ---');
    console.log(`- 새로 번역된 단어: ${translatedCount}개`);
    console.log(`- 새로 생성된 이미지 URL: ${imageUpdatedCount}개`);
    console.log('------------------');
  } catch (error) {
    console.error('스크립트 실행 중 심각한 오류 발생:', error);
  }
}

updateAllImages(); 
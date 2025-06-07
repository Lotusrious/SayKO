import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// --- 초기화 ---

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// .json 서비스 계정 키 파일 직접 읽기
const serviceAccountKeyPath = path.join(__dirname, '..', 'sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');
const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

// Firebase 초기화
initializeApp({
  credential: cert(serviceAccountKey),
});

// OpenAI 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const db = getFirestore();

// --- 헬퍼 함수 ---

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
    const translation = response.choices[0].message.content.trim().toLowerCase();
    return translation;
  } catch (error) {
    console.error(`'${koreanWord}' 번역 중 오류:`, error);
    return null;
  }
}

// --- 메인 로직 ---

async function populateAllMeanings() {
  console.log('--- meaning 필드 채우기 작업을 시작합니다 ---');
  const vocabCollection = db.collection('vocabularies');
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    const snapshot = await vocabCollection.get();
    const words = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    
    console.log(`총 ${words.length}개의 단어를 스캔합니다. 작업이 완료될 때까지 기다려 주세요...`);

    for (const word of words) {
      const wordKor = word.word;
      const wordEng = word.meaning;

      if (!wordKor || typeof wordKor !== 'string') {
        continue;
      }

      if (!wordEng || typeof wordEng !== 'string' || wordEng.trim() === '') {
        const translatedEng = await translateWord(wordKor);
        
        if (translatedEng) {
          try {
            await vocabCollection.doc(word.docId).update({ meaning: translatedEng });
            updatedCount++;
          } catch (dbError) {
            console.error(`[DB FAIL] ID: ${word.docId} 업데이트 실패:`, dbError);
            failedCount++;
          }
        } else {
          failedCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        skippedCount++;
      }
    }

    console.log('\\n--- 작업 완료 ---');
    console.log(`- 이미 채워져 있던 단어: ${skippedCount}개`);
    console.log(`- 새로 번역하여 채운 단어: ${updatedCount}개`);
    console.log(`- 번역/업데이트 실패: ${failedCount}개`);
    console.log('------------------');

  } catch (error) {
    console.error('스크립트 실행 중 심각한 오류 발생:', error);
  }
}

populateAllMeanings(); 
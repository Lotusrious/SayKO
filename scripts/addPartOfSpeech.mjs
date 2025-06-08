import admin from 'firebase-admin';
import { OpenAI } from 'openai';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// --- 설정 ---
const COLLECTION_NAME = 'vocabularies';
const SERVICE_ACCOUNT_KEY_FILENAME = 'sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json';
// OpenAI API 호출 사이의 딜레이 (ms). 속도 제한을 피하기 위해 사용.
const API_DELAY_MS = 200; 
// --- 설정 끝 ---

/**
 * Firebase Admin SDK를 초기화합니다.
 */
async function initializeFirebase() {
  try {
    const serviceAccount = JSON.parse(
      await readFile(new URL(`../${SERVICE_ACCOUNT_KEY_FILENAME}`, import.meta.url))
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK가 성공적으로 초기화되었습니다.');
    return admin.firestore();
  } catch (error) {
    console.error(`Firebase 초기화 실패: ${SERVICE_ACCOUNT_KEY_FILENAME} 파일을 프로젝트 루트에 올바르게 배치했는지 확인하세요.`, error.message);
    process.exit(1);
  }
}

/**
 * OpenAI 클라이언트를 초기화합니다.
 * .env 파일에 OPENAI_API_KEY가 필요합니다.
 */
function initializeOpenAI() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OpenAI 초기화 실패: .env 파일에 OPENAI_API_KEY를 설정하세요.');
    process.exit(1);
  }
  return new OpenAI({ apiKey: openaiApiKey });
}

/**
 * 단어의 품사를 가져옵니다.
 * @param {OpenAI} openai - OpenAI 클라이언트 인스턴스
 * @param {string} word - 품사를 찾을 영어 단어
 * @returns {Promise<string|null>} 품사 또는 null
 */
async function getPartOfSpeech(openai, word) {
  if (!word || typeof word !== 'string') {
    console.warn(`'${word}'는 유효한 단어가 아니므로 건너뜁니다.`);
    return null;
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert linguist. Your task is to identify the most common part of speech for a given English word. Respond with only a single word in lowercase (e.g., noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection)."
        },
        {
          role: "user",
          content: word
        }
      ],
      temperature: 0,
      max_tokens: 5,
    });
    return response.choices[0].message.content.trim().toLowerCase();
  } catch (error) {
    console.error(`'${word}' 단어의 품사를 가져오는 중 오류 발생:`, error.message);
    return null;
  }
}

/**
 * Firestore의 단어에 품사 정보를 추가하는 메인 함수
 */
async function addPartsOfSpeech() {
  const db = await initializeFirebase();
  const openai = initializeOpenAI();
  const vocabulariesRef = db.collection(COLLECTION_NAME);

  console.log(`'${COLLECTION_NAME}' 컬렉션의 문서를 확인합니다...`);

  try {
    const snapshot = await vocabulariesRef.get();
    const docsToUpdate = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // 'partOfSpeech' 필드가 없거나 비어있는 경우에만 처리
      if (!data.partOfSpeech) {
        // 'meaning' 필드가 문자열이면 사용, 객체면 'eng' 또는 'en' 속성 사용
        const englishWord = typeof data.meaning === 'string' 
          ? data.meaning 
          : (data.meaning?.eng || data.meaning?.en);

        if (englishWord) {
          docsToUpdate.push({ id: doc.id, word: data.word, eng: englishWord });
        } else {
            console.warn(`'${data.word}' 문서에 유효한 영어 단어('meaning')가 없어 건너뜁니다.`);
        }
      }
    });

    if (docsToUpdate.length === 0) {
      console.log('모든 단어에 이미 품사 정보가 있습니다. 작업을 종료합니다.');
      return;
    }

    console.log(`품사 정보가 필요한 ${docsToUpdate.length}개의 단어를 찾았습니다. 업데이트를 시작합니다.`);

    for (const docInfo of docsToUpdate) {
      const partOfSpeech = await getPartOfSpeech(openai, docInfo.eng);
      
      if (partOfSpeech) {
        await vocabulariesRef.doc(docInfo.id).update({ partOfSpeech });
        console.log(`- '${docInfo.word}' (${docInfo.eng}): 품사 '${partOfSpeech}' 추가 완료`);
      } else {
        console.log(`- '${docInfo.word}' (${docInfo.eng}): 품사를 가져오지 못해 건너뜁니다.`);
      }
      // API 속도 제한을 피하기 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
    }

    console.log('\n모든 단어의 품사 정보 업데이트가 완료되었습니다.');
  } catch (error) {
    console.error('데이터 처리 중 심각한 오류가 발생했습니다:', error);
  }
}

addPartsOfSpeech(); 
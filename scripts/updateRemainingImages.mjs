import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import FirecrawlApp from '@mendable/firecrawl-js';

// --- 스크립트 설정 및 초기화 ---

// 1. Firecrawl API 키를 명령줄 인자에서 가져옵니다.
const apiKey = process.argv[2];
if (!apiKey) {
  console.error('오류: Firecrawl API 키가 필요합니다.');
  console.error('사용법: node scripts/updateRemainingImages.mjs <YOUR_FIRECRAWL_API_KEY>');
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

// 3. 이미지 소스 정의
const sources = [
  {
    name: 'Unsplash',
    url: 'https://unsplash.com/s/photos/',
    findImage: (links) => links.find(link => link.includes('/download?')),
  },
  {
    name: 'Pexels',
    url: 'https://www.pexels.com/search/',
    findImage: (links) => links.find(link => link.includes('images.pexels.com/photos')),
  },
  {
    name: 'Pixabay',
    url: 'https://pixabay.com/photos/search/',
    findImage: (links) => {
      const canvaLink = links.find(link => link.includes('canva.com/content-partner'));
      if (!canvaLink) return null;
      try {
        const urlParams = new URL(canvaLink).searchParams;
        const imageUrl = urlParams.get('image-url');
        return imageUrl ? decodeURIComponent(imageUrl) : null;
      } catch (e) {
        return null;
      }
    },
  },
];

// --- 헬퍼 함수 ---

/**
 * 작업을 n 밀리초 동안 일시 중지합니다.
 * @param {number} ms - 대기할 시간 (밀리초)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 메인 로직 ---

/**
 * 이미지가 없는 단어를 찾아 여러 소스에서 이미지를 검색하고 DB를 업데이트합니다.
 */
async function updateMissingImages() {
  console.log('이미지 보충 작업을 시작합니다...');

  let wordsToUpdate = [];
  try {
    // Firestore 쿼리에 의존하지 않고 모든 문서를 가져와서 직접 필터링합니다.
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

  console.log(`총 ${wordsToUpdate.length}개의 단어에 대한 이미지 보충을 시작합니다.`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < wordsToUpdate.length; i++) {
    const word = wordsToUpdate[i];
    let imageUrlFound = null;

    for (const source of sources) {
      try {
        console.log(`[${i + 1}/${wordsToUpdate.length}] "${word.eng}" 검색 중 (${source.name})...`);
        const searchUrl = `${source.url}${encodeURIComponent(word.eng)}`;
        
        const scrapeResult = await app.scrapeUrl(searchUrl, {
          formats: ['links'],
          onlyMainContent: true,
        });

        if (scrapeResult && scrapeResult.links) {
            imageUrlFound = source.findImage(scrapeResult.links);
        }
        
        if (imageUrlFound) {
          console.log(`  -> ${source.name}에서 이미지 발견!`);
          break; // 이미지를 찾았으니 다음 단어로
        }

      } catch (error) {
        console.warn(`  - ${source.name}에서 "${word.eng}" 검색 중 오류 발생: ${error.message}`);
      }
      await sleep(1500); // 다음 소스 검색 전 잠시 대기
    }

    if (imageUrlFound) {
      try {
        await db.collection('vocabularies').doc(word.id).update({ imageUrl: imageUrlFound });
        console.log(`  -> "${word.eng}" (ID: ${word.id})의 이미지 URL을 Firestore에 업데이트했습니다.`);
        successCount++;
      } catch (dbError) {
        console.error(`  -> Firestore 업데이트 실패: ${dbError.message}`);
        failureCount++;
      }
    } else {
      console.log(`  -> 모든 소스에서 "${word.eng}"에 대한 이미지를 찾지 못했습니다.`);
      failureCount++;
    }
     await sleep(2000); // 다음 단어 검색 전 잠시 대기
  }

  console.log('\n--- 작업 완료 ---');
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failureCount}개`);
  console.log('-----------------');
}

// 스크립트 실행
updateMissingImages().catch(console.error); 
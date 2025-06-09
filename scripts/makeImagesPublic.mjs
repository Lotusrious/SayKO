import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin SDK 초기화
const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'sayko-f08c1.firebasestorage.app'
  });
}

const bucket = getStorage().bucket();

async function makeAllImagesPublic() {
  console.log('Firebase Storage의 `word_images/` 폴더에 있는 모든 이미지 파일을 공개로 전환합니다...');
  
  try {
    const [files] = await bucket.getFiles({ prefix: 'word_images/' });
    const webpFiles = files.filter(file => file.name.endsWith('.webp'));

    if (webpFiles.length === 0) {
      console.log('공개로 전환할 .webp 파일이 없습니다.');
      return;
    }
    
    console.log(`총 ${webpFiles.length}개의 .webp 파일을 대상으로 작업을 시작합니다.`);
    console.log('----------------------------------------------------');

    let successCount = 0;
    let errorCount = 0;
    
    const promises = webpFiles.map(async (file) => {
      try {
        await file.makePublic();
        // console.log(`[성공] ${file.name} 파일을 공개로 전환했습니다.`);
        successCount++;
      } catch (error) {
        console.error(`[실패] ${file.name} 파일 처리 중 오류 발생:`, error.message);
        errorCount++;
      }
    });

    await Promise.all(promises);
    
    console.log('----------------------------------------------------');
    console.log('✨ 모든 파일에 대한 권한 설정 작업이 완료되었습니다.');
    console.log(`- 성공: ${successCount}건`);
    console.log(`- 실패: ${errorCount}건`);

    if(errorCount === 0) {
        console.log('\n이제 웹사이트에서 이미지가 정상적으로 보여야 합니다. 브라우저 캐시를 지우고 확인해주세요!');
    }

  } catch (error) {
    console.error('Storage 파일 목록을 가져오는 중 오류가 발생했습니다:', error);
  }
}

makeAllImagesPublic().catch(console.error); 
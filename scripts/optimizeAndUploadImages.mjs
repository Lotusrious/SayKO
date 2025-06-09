import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(readFileSync(path.resolve(__dirname, '../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'sayko-f08c1.appspot.com',
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

async function optimizeAndUploadImages() {
  try {
    console.log('Firebase Storage에 없는 외부 이미지 URL을 최적화하고 업로드합니다...');
    
    const snapshot = await db.collection('vocabularies').get();
    const wordsToProcess = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.imageUrl && !data.imageUrl.includes('firebasestorage.googleapis.com')) {
        wordsToProcess.push({ id: doc.id, ...data });
      }
    });

    if (wordsToProcess.length === 0) {
      console.log('🎉 처리할 단어가 없습니다. 모든 이미지가 이미 Firebase Storage에 있습니다.');
      return;
    }

    console.log(`- 총 ${wordsToProcess.length}개의 단어를 처리합니다.`);

    let processedCount = 0;
    for (const wordDoc of wordsToProcess) {
      const { id, word, imageUrl } = wordDoc;

      try {
        console.log(`[${processedCount + 1}/${wordsToProcess.length}] 처리 중: ${word}`);

        // 1. 이미지 다운로드
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
        }
        const imageBuffer = await response.buffer();

        // 2. WebP 변환 및 리사이즈
        const optimizedImageBuffer = await sharp(imageBuffer)
          .resize({ width: 800 })
          .webp({ quality: 80 })
          .toBuffer();

        // 3. Firebase Storage에 업로드
        const fileName = `${encodeURIComponent(word)}.webp`;
        const file = bucket.file(`word_images/${fileName}`);
        await file.save(optimizedImageBuffer, {
          metadata: {
            contentType: 'image/webp',
          },
        });

        // 4. 공개 URL 가져오기 (만료 시간 없이)
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
        
        // 5. Firestore 문서 업데이트
        await db.collection('vocabularies').doc(id).update({
          imageUrl: publicUrl,
          imageUpdatedAt: Timestamp.now(),
        });
        
        console.log(`  ✅ 성공: ${word} -> ${publicUrl}`);
        processedCount++;
      } catch (error) {
        console.error(`  ❌ 실패: ${word} 처리 중 오류 발생`, error.message);
      }
    }

    console.log(`\n🎉 성공적으로 ${processedCount}개의 단어를 처리했습니다.`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 심각한 오류가 발생했습니다:', error);
  }
}

optimizeAndUploadImages(); 
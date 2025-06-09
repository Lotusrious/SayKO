import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';

// 서비스 계정 키 파일 경로
const serviceAccountKeyPath = path.resolve('sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');
const serviceAccount = JSON.parse(await fs.readFile(serviceAccountKeyPath, 'utf-8'));

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadWords() {
  const wordsFilePath = path.resolve('src/data/initialWords.json');
  
  console.log('Reading initialWords.json...');
  const words = JSON.parse(await fs.readFile(wordsFilePath, 'utf-8'));

  const collectionRef = db.collection('words');
  const batch = db.batch();

  console.log('Preparing batch write to Firestore for "words" collection...');
  words.forEach(word => {
    // 각 단어를 문서로 추가합니다. 문서 ID는 자동으로 생성됩니다.
    const docRef = collectionRef.doc(); 
    batch.set(docRef, word);
  });

  try {
    console.log('Committing batch write...');
    await batch.commit();
    console.log(`Successfully uploaded ${words.length} documents to 'words' collection.`);
  } catch (error) {
    console.error('Error uploading documents to Firestore:', error);
  }
}

uploadWords(); 
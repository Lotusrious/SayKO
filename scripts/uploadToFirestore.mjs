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

async function uploadVocabularies() {
  const vocabulariesFilePath = path.resolve('src/data/vocabularies.json');
  
  console.log('Reading vocabularies.json...');
  const vocabularies = JSON.parse(await fs.readFile(vocabulariesFilePath, 'utf-8'));

  const collectionRef = db.collection('vocabularies');
  const batch = db.batch();

  console.log('Preparing batch write to Firestore...');
  vocabularies.forEach(vocab => {
    // 각 단어를 문서로 추가합니다. 문서 ID는 자동으로 생성됩니다.
    const docRef = collectionRef.doc(); 
    batch.set(docRef, vocab);
  });

  try {
    console.log('Committing batch write...');
    await batch.commit();
    console.log(`Successfully uploaded ${vocabularies.length} documents to 'vocabularies' collection.`);
  } catch (error) {
    console.error('Error uploading documents to Firestore:', error);
  }
}

uploadVocabularies(); 
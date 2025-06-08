import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// 이전 단계에서 확인한 정확한 서비스 계정 키 파일명을 사용합니다.
const serviceAccount = require('../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');

// 사용자 ID를 하드코딩합니다 (로그에서 확인된 값).
const USER_ID = 'OUoLAW7ysqekPIYUC25bpT0Csns2';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkTestResultSchema() {
  try {
    console.log(`Fetching the first document from 'users/${USER_ID}/testResults' to check its schema...`);
    
    const snapshot = await db.collection('users').doc(USER_ID).collection('testResults').limit(1).get();
    
    if (snapshot.empty) {
      console.log('No documents found in the subcollection.');
      return;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('========================================');
    console.log('Document ID:', doc.id);
    console.log('Document Data (Schema):');
    console.log(JSON.stringify(data, null, 2));
    console.log('========================================');
    console.log('Timestamp field type:', typeof data.timestamp);
    if (data.timestamp) {
      console.log('Is it a Firestore Timestamp?', data.timestamp.constructor.name === 'Timestamp');
    }

  } catch (error) {
    console.error('Error fetching document:', error);
  }
}

checkTestResultSchema(); 
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process';

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

const db = getFirestore();
const wordToFind = '미사용';

async function diagnoseImageUrl() {
    console.log(`'${wordToFind}' 단어의 이미지 URL을 가져와서 접근 권한을 확인합니다...`);
    const snapshot = await db.collection('vocabularies').where('word', '==', wordToFind).limit(1).get();

    if (snapshot.empty) {
        console.log(`'${wordToFind}' 단어를 Firestore에서 찾을 수 없습니다.`);
        return;
    }

    const doc = snapshot.docs[0];
    const imageUrl = doc.data().imageUrl;

    if (!imageUrl) {
        console.log(`'${wordToFind}' 단어에 imageUrl 필드가 없습니다.`);
        return;
    }

    console.log(`\n[확인된 URL] ${imageUrl}\n`);
    console.log('이 URL로 HTTP 요청을 보내 응답 헤더를 확인합니다...');
    console.log('----------------------------------------------------');

    exec(`curl -I "${imageUrl}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('`curl` 명령어 실행 중 에러가 발생했습니다:', error);
            return;
        }
        if (stderr) {
            console.error('`curl` 명령어 stderr:', stderr);
        }
        
        console.log('`curl` 응답 결과:\n');
        console.log(stdout);
        console.log('----------------------------------------------------');

        if (stdout.includes('HTTP/2 403')) {
            console.log('🚨 진단 결과: 403 Forbidden 오류가 확인되었습니다.');
            console.log('예상대로 Storage에 있는 파일의 공개 읽기 권한이 설정되지 않은 것 같습니다.');
            console.log('즉시 모든 이미지 파일을 공개로 전환하는 작업을 시작하겠습니다.');
        } else if (stdout.includes('HTTP/2 200')) {
            console.log('✅ 진단 결과: 200 OK. URL 및 권한은 정상입니다.');
            console.log('문제가 다른 곳에 있을 수 있습니다. (예: 프론트엔드 코드, 브라우저 캐시)');
        } else {
            console.log('예상치 못한 응답입니다. 응답 코드를 확인해주세요.');
        }
    });
}

diagnoseImageUrl().catch(console.error); 
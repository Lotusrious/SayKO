import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import path from 'path';

// 서비스 계정 키 파일 경로. ***실제 경로로 수정 필요***
const serviceAccountPath = path.resolve('./sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const vocabulariesCollection = db.collection('vocabularies');

async function uploadJsonToFirestore(filePath, priority) {
  try {
    const fileContent = await readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      throw new Error(`JSON data in ${filePath} is not an array.`);
    }

    const batchSize = 500;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = db.batch();
      const chunk = data.slice(i, i + batchSize);

      chunk.forEach(item => {
        // 문서 ID를 word 필드를 사용하여 생성 (중복 방지)
        // Firestore 문서 ID에는 '/' 문자를 사용할 수 없으므로 '_'로 대체합니다.
        const docId = item.word.replace(/\//g, '_');
        const docRef = vocabulariesCollection.doc(docId);
        const dataWithPriority = { ...item, priority };
        batch.set(docRef, dataWithPriority, { merge: true });
      });

      await batch.commit();
      console.log(`Batch ${Math.floor(i / batchSize) + 1} from ${filePath} uploaded successfully with priority ${priority}.`);
    }

    console.log(`All data from ${filePath} has been uploaded successfully.`);
  } catch (error) {
    console.error(`Error uploading data from ${filePath}:`, error);
  }
}

async function updateExistingWordsPriority(priority) {
    try {
        // priority 필드가 없는 문서만 선택하여 업데이트합니다.
        const snapshot = await vocabulariesCollection.where('priority', '==', null).get();
        
        if (snapshot.empty) {
            console.log('No documents to update.');
            return;
        }

        const batchSize = 500;
        let batch = db.batch();
        let count = 0;

        for (const doc of snapshot.docs) {
            const docRef = vocabulariesCollection.doc(doc.id);
            batch.update(docRef, { priority: priority });
            count++;
            if (count % batchSize === 0) {
                await batch.commit();
                batch = db.batch();
                console.log(`Updated priority for ${count} documents.`);
            }
        }

        if (count > 0 && count % batchSize !== 0) {
            await batch.commit();
        }
        
        console.log(`Successfully updated priority for ${count} existing documents to ${priority}.`);

    } catch (error) {
        console.error('Error updating existing words priority:', error);
    }
}


async function main() {
  console.log('--- Starting data upload process ---');

  // 1. 기존 500 단어 업로드 (priority: 2)
  console.log('\\nStep 1: Uploading standard vocabulary with priority 2...');
  await uploadJsonToFirestore('./src/data/vocabularies.json', 2);

  // 2. 기초 단어 업로드 (priority: 1)
  console.log('\\nStep 2: Uploading basic words with priority 1...');
  await uploadJsonToFirestore('./src/data/basicWords.json', 1);

  console.log('\\n--- All operations completed successfully! ---');
}

main(); 
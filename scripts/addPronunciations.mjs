import admin from 'firebase-admin';
import { createRequire } from 'module';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const serviceAccount = require('../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function addPronunciations() {
  try {
    console.log('Fetching all documents from the vocabularies collection...');
    const snapshot = await db.collection('vocabularies').get();
    const allDocs = snapshot.docs;
    const totalDocs = allDocs.length;
    console.log(`Found ${totalDocs} documents. Starting update process...`);

    let processedCount = 0;
    for (const doc of allDocs) {
      processedCount++;
      const wordData = doc.data();
      const koreanWord = wordData.word; // 'korean' 필드가 아니라 'word' 필드를 사용합니다.

      // koreanWord가 유효한 문자열인지 확인합니다.
      if (!koreanWord || typeof koreanWord !== 'string') {
        console.log(`(${processedCount}/${totalDocs}) Skipping document ${doc.id}, 'word' field is missing or invalid.`);
        continue;
      }

      try {
        console.log(`(${processedCount}/${totalDocs}) - Generating pronunciation for '${koreanWord}'...`);
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Korean romanization. Provide only the Revised Romanization of the given Korean word, without any additional text or explanation. For example, if the input is "안녕", the output should be "annyeong".',
            },
            {
              role: 'user',
              content: koreanWord,
            },
          ],
          temperature: 0,
          max_tokens: 20,
        });

        const pronunciation = response.choices[0].message.content.trim();
        await db.collection('vocabularies').doc(doc.id).update({ pronunciation });
        console.log(`  -> Successfully updated '${koreanWord}' with pronunciation: '${pronunciation}'`);

      } catch (error) {
        console.error(`(${processedCount}/${totalDocs}) Failed to process word '${koreanWord}' (doc: ${doc.id}):`, error);
      }
    }

    console.log('All documents have been processed.');
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

addPronunciations(); 
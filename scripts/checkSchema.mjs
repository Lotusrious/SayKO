import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../sayko-f08c1-firebase-adminsdk-fbsvc-7376c9e12e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkFirstDocumentSchema() {
  try {
    console.log('Fetching the first document from the vocabularies collection to check its schema...');
    
    const snapshot = await db.collection('vocabularies').limit(1).get();
    
    if (snapshot.empty) {
      console.log('No documents found in the collection.');
      return;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('========================================');
    console.log('Document ID:', doc.id);
    console.log('Document Data (Schema):');
    console.log(JSON.stringify(data, null, 2));
    console.log('========================================');

  } catch (error) {
    console.error('Error checking document schema:', error);
  }
}

checkFirstDocumentSchema(); 
// File: scripts/addMoreWords.mjs
// ...
async function main() {
  console.log('--- 단어 추가 작업을 시작합니다 ---');
  // ...
  if (wordsNeeded <= 0) {
    console.log(`이미 목표 단어 수(${targetCount}개) 이상이므로, 작업을 종료합니다.`);
    return;
  }
  // ...
  console.log(`-> ${newWords.length}개의 단어를 새로 생성했습니다.`);
  // ...
  console.log(`-> 총 ${uniqueWords.length}개의 단어를 파일에 저장했습니다.`);
  console.log('--- 작업 완료 ---');
}
main();

// File: scripts/generateExamples.mjs
// ...
async function main() {
  console.log('--- 예문 생성 작업을 시작합니다 ---');
  // ...
  for (const word of words) {
    // ...
  }
  // ...
  console.log('--- 작업 완료 ---');
  console.log(`-> 총 ${wordExamples.length}개의 단어에 대한 예문을 생성하여 파일에 저장했습니다.`);
}
main();

// File: scripts/structureData.mjs
// ...
function main() {
  console.log('--- 데이터 구조화 작업을 시작합니다 ---');
  // ...
  console.log('--- 작업 완료 ---');
  console.log(`-> 총 ${structuredData.length}개의 단어 데이터를 구조화하여 파일에 저장했습니다.`);
}
main();

// File: scripts/uploadToFirestore.mjs
// ...
async function main() {
  console.log('--- Firestore 데이터 업로드 작업을 시작합니다 ---');
  // ...
  console.log(`-> ${vocabularies.length}개의 문서를 성공적으로 업로드했습니다.`);
  console.log('--- 작업 완료 ---');
}
main();

// File: scripts/uploadBasicWords.mjs
// ...
async function main() {
  console.log('--- 우선순위 단어 데이터 업로드/업데이트 작업을 시작합니다 ---');
  // ...
  console.log('\\n-> Step 1: 일반 단어 업로드 완료');
  // ...
  console.log('\\n-> Step 2: 기초 단어 업로드 완료');
  console.log('\\n--- 모든 작업이 완료되었습니다! ---');
}
main();

// File: scripts/generateWords.mjs
// ...
async function main() {
  console.log('--- OpenAI 단어 생성 작업을 시작합니다 ---');
  // ...
  console.log(`-> ${wordsArray.length}개의 단어를 생성하여 파일에 저장했습니다.`);
  console.log('--- 작업 완료 ---');
}
main(); 
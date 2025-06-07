import fs from 'fs/promises';
import path from 'path';

/**
 * @typedef {object} Example
 * @property {string} korean
 * @property {string} english
 */

/**
 * @typedef {object} InputData
 * @property {string} word
 * @property {Example} examples
 */

/**
 * @typedef {object} Vocabulary
 * @property {string} word
 * @property {string} meaning
 * @property {Example[]} sentences
 */

async function structureData() {
  const inputFilePath = path.resolve('src/data/wordExamples.json');
  const outputFilePath = path.resolve('src/data/vocabularies.json');

  console.log('Reading wordExamples.json...');
  /** @type {InputData[]} */
  const sourceData = JSON.parse(await fs.readFile(inputFilePath, 'utf-8'));

  console.log('Transforming data to the target structure...');
  /** @type {Vocabulary[]} */
  const vocabularies = sourceData.map(item => ({
    word: item.word,
    meaning: '', // 현재는 영어 뜻 데이터가 없으므로 비워둡니다.
    sentences: [
      {
        korean: item.examples.korean,
        english: item.examples.english,
      },
    ],
  }));

  console.log(`Writing structured data to ${outputFilePath}...`);
  await fs.writeFile(outputFilePath, JSON.stringify(vocabularies, null, 2), 'utf-8');

  console.log('Done! Data structuring is complete.');
}

structureData(); 
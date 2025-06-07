import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const a = 'a'.charCodeAt(0);
const z = 'z'.charCodeAt(0);
function isEnglish(text) {
  const lowercased = text.toLowerCase();
  for (let i = 0; i < lowercased.length; i++) {
    const code = lowercased.charCodeAt(i);
    if (code >= a && code <= z) {
      return true;
    }
  }
  return false;
}

async function generateExample(word) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for Korean language learners. For a given Korean word, create one simple, practical example sentence in Korean and its English translation. The target audience is a beginner. Provide the output in a JSON object with "korean" and "english" keys.`,
        },
        {
          role: 'user',
          content: word,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return { word, examples: result };
  } catch (error) {
    console.error(`Error generating example for "${word}":`, error);
    return { word, examples: { korean: '', english: '' } };
  }
}

async function main() {
  const inputFilePath = path.resolve('src/data/initialWords.json');
  const outputFilePath = path.resolve('src/data/wordExamples.json');

  console.log('Reading initial words...');
  const words = JSON.parse(await fs.readFile(inputFilePath, 'utf-8'));

  const results = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // 영어 단어는 건너뛰기
    if (isEnglish(word)) {
      console.log(`Skipping English word: ${word}`);
      continue;
    }

    console.log(`Generating example for "${word}" (${i + 1}/${words.length})`);
    const exampleData = await generateExample(word);
    results.push(exampleData);
    // API rate limit을 피하기 위해 약간의 딜레이 추가
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('Writing results to wordExamples.json...');
  await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('Done!');
}

main(); 
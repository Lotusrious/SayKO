import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// .env 파일에서 환경 변수를 로드합니다.
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 데이터를 읽고 저장할 파일 경로
const filePath = path.join(process.cwd(), 'src', 'data', 'initialWords.json');

async function main() {
  try {
    console.log(`기존 단어 파일을 읽어옵니다: ${filePath}`);
    
    // 1. 기존 단어 목록 읽기
    let existingWords = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingWords = JSON.parse(fileContent);
    } catch (error) {
      console.log('기존 단어 파일이 없으므로, 빈 목록에서 시작합니다.');
    }
    
    console.log(`현재 단어 수: ${existingWords.length}개`);

    const targetCount = 500;
    const wordsNeeded = targetCount - existingWords.length;

    if (wordsNeeded <= 0) {
      console.log(`이미 ${targetCount}개 이상의 단어가 있으므로, 스크립트를 종료합니다.`);
      return;
    }

    console.log(`${wordsNeeded}개의 단어를 추가로 생성합니다.`);
    
    // 2. 새로운 단어 생성을 위한 프롬프트 구성
    const prompt = `
      당신은 한국어 교육 및 여행 전문가입니다.
      '일상 생활'과 '여행'과 관련된, 한국어 초중급 학습자를 위한 새로운 핵심 단어를 ${wordsNeeded}개 생성해주세요.
      
      다음의 기준을 반드시 지켜주세요:
      1. 결과물에 절대 중복된 단어가 없어야 합니다.
      2. 특히, 다음에 나오는 단어 목록은 반드시 제외해야 합니다: ${JSON.stringify(existingWords)}
      3. 명사, 동사, 형용사 등 다양한 품사를 골고루 포함해주세요.
      4. 음식, 교통, 쇼핑, 숙소, 감정 표현, 길 묻기 등 실제 상황과 관련된 실용적인 단어 위주로 선정해주세요.
      
      결과는 다른 설명 없이, ["새단어1", "새단어2", ..., "새단어${wordsNeeded}"] 형식의 JSON 배열로만 응답해주세요.
    `;

    // 3. OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant designed to output JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('API 응답에서 내용을 찾을 수 없습니다.');
    }

    const result = JSON.parse(content);
    const newWords = result.words || result.단어 || result;

    if (!Array.isArray(newWords)) {
      throw new Error('응답이 유효한 단어 배열이 아닙니다.');
    }
    
    console.log(`새로운 단어 ${newWords.length}개를 생성했습니다.`);

    // 4. 기존 목록과 새 목록을 합치고 중복 제거
    const combinedWords = [...existingWords, ...newWords];
    const uniqueWords = [...new Set(combinedWords)];

    console.log(`총 단어 수 (중복 제거 후): ${uniqueWords.length}개`);

    // 5. 최종 목록을 파일에 저장
    await fs.writeFile(filePath, JSON.stringify(uniqueWords, null, 2), 'utf-8');

    console.log(`총 ${uniqueWords.length}개의 단어가 ${filePath} 파일에 성공적으로 저장되었습니다.`);

  } catch (error) {
    console.error('단어 추가 중 오류가 발생했습니다:', error);
  }
}

main(); 
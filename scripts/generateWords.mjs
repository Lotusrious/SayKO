import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// .env 파일에서 환경 변수를 로드합니다.
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 데이터를 저장할 디렉토리 경로
const dataDir = path.join(process.cwd(), 'src', 'data');
// 최종 저장될 파일 경로
const outputPath = path.join(dataDir, 'initialWords.json');

async function main() {
  try {
    console.log('OpenAI API를 호출하여 단어 생성을 시작합니다...');

    const prompt = `
      당신은 한국어 교육 및 여행 전문가입니다.
      한국어를 배우는 초중급 레벨의 외국인 학습자가 '일상 생활'과 '여행' 중에 가장 빈번하게 사용하고 마주치는 핵심 단어 500개를 선정해주세요.
      
      다음의 기준을 반드시 지켜주세요:
      1. 결과물에 절대 중복된 단어가 없어야 합니다.
      2. 명사, 동사, 형용사 등 다양한 품사를 골고루 포함해주세요. (예: 예약하다, 맵다, 공항, 호텔, 지하철, 예쁘다, 맛있다 등)
      3. 너무 기초적인 단어 (예: 나, 너, 우리)나 너무 어려운 전문 용어는 피해주세요.
      4. 음식, 교통, 쇼핑, 숙소, 감정 표현, 길 묻기 등 실제 상황과 관련된 실용적인 단어 위주로 선정해주세요.
      
      결과는 다른 설명 없이, ["단어1", "단어2", "단어3", ..., "단어500"] 형식의 JSON 배열로만 응답해주세요.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // 또는 gpt-4, gpt-3.5-turbo 등 사용 가능한 최신 모델
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
    
    // JSON 문자열을 파싱합니다.
    // API가 JSON 객체 안에 배열을 포함하여 반환할 수 있으므로, 해당 구조를 처리합니다.
    const result = JSON.parse(content);
    const wordsArray = result.words || result.단어 || result; // 다양한 키 가능성에 대비

    if (!Array.isArray(wordsArray)) {
      throw new Error('응답이 유효한 단어 배열이 아닙니다.');
    }

    console.log(`성공적으로 ${wordsArray.length}개의 단어를 생성했습니다.`);

    // 'src/data' 디렉토리가 없으면 생성합니다.
    await fs.mkdir(dataDir, { recursive: true });

    // 생성된 단어 목록을 JSON 파일로 저장합니다.
    await fs.writeFile(outputPath, JSON.stringify(wordsArray, null, 2), 'utf-8');

    console.log(`단어 목록이 ${outputPath} 파일에 성공적으로 저장되었습니다.`);

  } catch (error) {
    console.error('단어 생성 중 오류가 발생했습니다:', error);
  }
}

main(); 
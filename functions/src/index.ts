/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {TextToSpeechClient, protos} from "@google-cloud/text-to-speech";

// Google TTS 클라이언트 초기화
// GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되어 있으면,
// 라이브러리가 자동으로 해당 키 파일을 사용하여 인증합니다.
const ttsClient = new TextToSpeechClient();

export const getTtsAudio = onRequest(async (request, response) => {
  // CORS 헤더 설정
  // 실제 프로덕션에서는 "*" 대신 특정 프론트엔드 도메인을 명시하는 것이 보안상 안전합니다.
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  // CORS pre-flight 요청(OPTIONS)에 대한 처리
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // POST 요청이 아닌 경우 에러 처리
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    logger.info("TTS function triggered");

    // 요청 본문에서 'text' 파라미터 확인
    if (!request.body.text) {
      logger.error("Text to synthesize not provided.");
      response.status(400).send("Text to synthesize not provided.");
      return;
    }

    const textToSynthesize = request.body.text;
    logger.info(`Synthesizing speech for text: ${textToSynthesize}`);

    const ttsRequest: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: {text: textToSynthesize},
      voice: {
        languageCode: "ko-KR",
        ssmlGender: "NEUTRAL",
      },
      audioConfig: {audioEncoding: "MP3"},
    };

    // TTS API 호출
    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);

    if (ttsResponse.audioContent) {
      // 성공적으로 오디오 데이터를 Base64 문자열로 반환
      response.set("Content-Type", "application/json");
      response.status(200).send(JSON.stringify({
        audioContent: Buffer.from(ttsResponse.audioContent).toString("base64"),
      }));
      logger.info("Successfully synthesized speech.");
    } else {
      logger.error("Audio content is null or undefined.");
      response.status(500).send("Failed to generate audio content.");
    }
  } catch (error) {
    logger.error("Error synthesizing speech:", error);
    response.status(500).send("Error synthesizing speech.");
  }
});

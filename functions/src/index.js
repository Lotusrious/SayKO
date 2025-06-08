/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {TextToSpeechClient} = require("@google-cloud/text-to-speech");

// TTS 클라이언트 초기화
const ttsClient = new TextToSpeechClient();

exports.getTTSAudio = onRequest(async (request, response) => {
  // 어떤 요청이 오든 CORS 헤더를 최우선으로 설정합니다.
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  // 브라우저의 사전 확인 요청(OPTIONS)에 응답합니다.
  if (request.method === "OPTIONS") {
    logger.info("CORS preflight request handled.");
    response.status(204).send("");
    return;
  }

  // 실제 데이터 요청(POST)을 처리합니다.
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  logger.info("Handling POST request for TTS.");
  
  try {
    const {text, languageCode = "ko-KR"} = request.body;

    if (!text) {
      logger.error("Text for TTS is missing in the request body");
      response.status(400).send("Bad Request: 'text' is required.");
      return;
    }

    logger.info(`Requesting TTS for text: "${text}" in language: ${languageCode}`);

    const ttsRequest = {
      input: {text},
      voice: {languageCode, ssmlGender: "NEUTRAL"},
      audioConfig: {audioEncoding: "MP3"},
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioContent = ttsResponse.audioContent;

    if (audioContent) {
      response.status(200).json({
        audioContent: audioContent.toString("base64"),
      });
    } else {
      logger.error("TTS response did not contain audio content.");
      response.status(500).send("Internal Server Error: Failed to generate audio.");
    }
  } catch (error) {
    logger.error("Error in getTTSAudio function", error);
    response.status(500).send("Internal Server Error");
  }
}); 
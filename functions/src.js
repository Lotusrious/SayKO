const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {TextToSpeechClient} = require("@google-cloud/text-to-speech");

// TTS 클라이언트 초기화
const ttsClient = new TextToSpeechClient();

exports.getTTSAudio = onRequest(async (request, response) => {
  // 1. 모든 출처(*)에서의 요청을 허용하도록 CORS 헤더를 명시적으로 설정합니다.
  response.set("Access-Control-Allow-Origin", "*");

  // 2. 브라우저가 보내는 사전 요청(preflight request, OPTIONS)을 처리합니다.
  if (request.method === "OPTIONS") {
    // 사전 요청에 필요한 헤더들을 설정합니다.
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  // 3. 실제 데이터 요청(POST)을 처리합니다.
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {text, languageCode = "ko-KR"} = request.body;

    if (!text) {
      logger.error("Text for TTS is missing in the request body");
      response.status(400).send("Bad Request: 'text' is required.");
      return;
    }

    logger.info(`Requesting TTS for text: "${text}" in language: ${languageCode}`);

    // TTS API 요청 구성
    const ttsRequest = {
      input: {text},
      voice: {languageCode, ssmlGender: "NEUTRAL"},
      audioConfig: {audioEncoding: "MP3"},
    };

    // API 호출
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
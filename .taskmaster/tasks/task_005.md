# Task: Google Cloud TTS API 연동 설정

- **ID**: 5
- **Status**: pending
- **Priority**: high
- **Dependencies**: 1

## Description
Google Cloud Text-to-Speech API 사용을 위한 초기 설정 및 서비스 계정을 구성합니다.

## Details
1. Google Cloud Platform에서 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2. Text-to-Speech API를 활성화합니다.
3. API 요청 인증을 위한 서비스 계정(Service Account)을 생성하고, JSON 형식의 키 파일을 다운로드합니다.
4. **주의:** 보안을 위해 이 JSON 키 파일은 Git 저장소에 포함시키지 않고, Firebase Functions 또는 서버 환경의 환경 변수로 안전하게 관리해야 합니다.
5. 프론트엔드에서 직접 호출하는 대신, TTS 요청을 처리할 Firebase Cloud Function을 준비합니다. 이는 API 키를 안전하게 보호하기 위함입니다.

## Test Strategy
간단한 Firebase Cloud Function을 작성하여 Google TTS API에 테스트 요청을 보내고, 음성 데이터(예: base64 인코딩된 mp3)를 성공적으로 수신하는지 확인합니다. 함수 로그를 통해 인증이 성공했는지 검증합니다. 
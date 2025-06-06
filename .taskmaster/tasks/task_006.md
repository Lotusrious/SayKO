# Task: TTS 음성 재생 기능 구현

- **ID**: 6
- **Status**: pending
- **Priority**: medium
- **Dependencies**: 5, 7

## Description
단어나 예문 옆의 스피커 아이콘을 클릭했을 때, Firebase Cloud Function을 통해 TTS API를 호출하고 반환된 음성 데이터를 재생하는 기능을 구현합니다.

## Details
1. 단어와 예문 옆에 스피커 아이콘 UI를 추가합니다.
2. 아이콘 클릭 시, 해당 텍스트와 언어 코드를 인자로 받아 Firebase Cloud Function(HTTPS Callable)을 호출하는 로직을 작성합니다.
3. Cloud Function은 Google TTS API를 호출하여 음성 데이터를 생성하고, 이를 base64 문자열 형태로 클라이언트에 반환합니다.
4. 클라이언트는 수신한 base64 데이터를 오디오 소스로 변환하고, HTML `<audio>` 엘리먼트를 동적으로 생성하거나 Web Audio API를 사용하여 재생합니다.

## Test Strategy
UI의 스피커 아이콘을 클릭하여 한국어, 영어, 독일어 텍스트가 올바른 발음으로 재생되는지 테스트합니다. 네트워크 탭에서 Cloud Function이 성공적으로 호출되고 오디오 데이터를 반환하는지 확인합니다. 여러 번 클릭해도 안정적으로 동작하는지 확인합니다. 
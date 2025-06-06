# Task: 배포 및 최종 테스트

- **ID**: 20
- **Status**: pending
- **Priority**: high
- **Dependencies**: 19

## Description
Firebase Hosting을 통해 웹 애플리케이션을 배포하고, 최종 E2E(End-to-End) 테스트를 수행합니다.

## Details
1. `npm run build`를 통해 프로덕션 빌드를 생성합니다.
2. Firebase CLI를 사용하여 빌드된 파일을 Firebase Hosting에 배포합니다.
3. 배포된 라이브 URL을 통해 회원가입부터 시험 응시, 결과 확인까지의 전체 사용자 시나리오를 처음부터 끝까지 테스트합니다.
4. CI/CD 파이프라인(예: GitHub Actions)을 설정하여 `main` 브랜치에 푸시될 때마다 자동으로 배포되도록 구성합니다.

## Test Strategy
배포된 URL에서 모든 기능이 로컬 개발 환경과 동일하게 작동하는지 확인합니다. 특히 API 호출(Cloud Functions)이 정상적으로 이루어지는지 네트워크 탭을 통해 검증합니다. 실제 모바일 기기에서 접속하여 최종 사용성을 점검합니다. 
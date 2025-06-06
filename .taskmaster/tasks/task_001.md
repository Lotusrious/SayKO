# Task: 프로젝트 설정 및 Firebase 초기화

- **ID**: 1
- **Status**: done
- **Priority**: high
- **Dependencies**: 

## Description
Vite를 사용하여 React + TypeScript 프로젝트를 생성하고 Firebase를 연동합니다.

## Details
1. Vite를 사용하여 React와 TypeScript 기반의 신규 프로젝트를 생성합니다.
2. Firebase 콘솔에서 새 프로젝트를 설정합니다 (Authentication, Firestore, Hosting 활성화).
3. 프로젝트에 Firebase SDK를 설치하고, `firebaseConfig.js` 또는 환경 변수를 통해 초기화 설정을 완료합니다.
4. 기본 폴더 구조(components, pages, services, types, hooks)를 설정합니다.

## Test Strategy
애플리케이션이 `npm run dev`로 에러 없이 실행되는지 확인합니다. Firebase 서비스(예: Firestore 데이터 읽기)가 프론트엔드와 성공적으로 연결되는지 간단한 테스트 코드로 검증합니다. 
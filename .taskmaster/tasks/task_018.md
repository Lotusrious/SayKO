# Task: 전체 라우팅 및 네비게이션 설정

- **ID**: 18
- **Status**: pending
- **Priority**: medium
- **Dependencies**: 2, 10, 17

## Description
React Router DOM을 사용하여 앱의 모든 페이지 간의 흐름을 정의하고 네비게이션 UI를 구현합니다.

## Details
1. `App.js` 또는 `main.jsx`에서 모든 페이지 경로(로그인, 회원가입, 대시보드, 시험, 결과, 설정 등)를 설정합니다.
2. 로그인 상태에 따라 동적으로 표시되는 상단 네비게이션 바 컴포넌트를 생성합니다.
3. 인증이 필요한 페이지는 이전에 구현한 `ProtectedRoute`로 감싸서 보호합니다.

## Test Strategy
네비게이션 바의 링크를 클릭하여 모든 페이지로 정상적으로 이동하는지 확인합니다. 브라우저 주소창에 직접 URL을 입력했을 때도 올바른 페이지가 로드되는지 확인합니다. 
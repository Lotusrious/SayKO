# Task: 사용자 인증 시스템 구축

- **ID**: 2
- **Status**: pending
- **Priority**: high
- **Dependencies**: 1

## Description
Firebase Authentication을 사용하여 이메일/비밀번호 기반의 회원가입, 로그인, 로그아웃 기능을 구현합니다.

## Details
1. 회원가입, 로그인, 비밀번호 재설정 페이지 UI를 생성합니다.
2. Firebase Auth의 `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `sendPasswordResetEmail` 함수를 사용하여 인증 로직을 구현합니다.
3. 사용자의 로그인 상태를 전역적으로 관리하기 위한 Context API 또는 상태 관리 라이브러리(Zustand 등)를 설정합니다.
4. 로그인된 사용자만 접근할 수 있는 보호된 라우트(Protected Route)를 구현합니다.

## Test Strategy
신규 사용자가 성공적으로 가입하고 Firestore `users` 컬렉션에 문서가 생성되는지 확인합니다. 사용자가 로그인 및 로그아웃 할 수 있는지 테스트합니다. 로그아웃 상태에서 보호된 페이지 접근 시 로그인 페이지로 리디렉션되는지 확인합니다. 
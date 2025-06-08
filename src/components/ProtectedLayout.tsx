import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const ProtectedLayout: React.FC = () => {
  // 기본적으로 모바일 너비(max-w-md)를 가지지만,
  // 중간 크기 화면(md) 이상에서는 더 넓은 너비(max-w-4xl)를 갖도록 설정합니다.
  const mainClass = "w-full max-w-md md:max-w-4xl mx-auto pt-16 px-4 pb-8";

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <Header />
      <main className={mainClass}>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout; 
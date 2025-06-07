import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const ProtectedLayout: React.FC = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <Header />
      <main className="w-full max-w-md mx-auto pt-16 px-4 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout; 
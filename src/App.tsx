import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedLayout from '@/components/ProtectedLayout';
import LoginPage from '@/pages/Login';
import LearningPage from '@/pages/LearningPage';
import TestPage from '@/pages/TestPage';
import ImageCardPage from '@/pages/ImageCardPage';
import HomePage from '@/pages/HomePage';
import TestResultPage from '@/pages/TestResultPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes with Header Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/learn" element={<LearningPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/test-result/:resultId" element={<TestResultPage />} />
          <Route path="/image-cards" element={<ImageCardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

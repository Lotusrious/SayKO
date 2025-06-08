import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LearningPage from './pages/LearningPage';
import TestPage from './pages/TestPage';
import ImageCardPage from './pages/ImageCardPage';
import TestResultPage from './pages/TestResultPage';
import ProtectedLayout from './components/ProtectedLayout';
import MyPage from './pages/MyPage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Private Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/learn" element={<PrivateRoute><LearningPage /></PrivateRoute>} />
            <Route path="/test" element={<PrivateRoute><TestPage /></PrivateRoute>} />
            <Route path="/image-cards" element={<PrivateRoute><ImageCardPage /></PrivateRoute>} />
            <Route path="/test-result" element={<PrivateRoute><TestResultPage /></PrivateRoute>} />
            <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
            <Route path="/review" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

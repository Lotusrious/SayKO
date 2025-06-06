import './firebase.ts';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './firebase.ts'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </StrictMode>,
)

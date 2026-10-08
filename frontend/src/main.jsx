import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ServicesProvider } from './context/ServicesContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ServicesProvider>
          <App />
        </ServicesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

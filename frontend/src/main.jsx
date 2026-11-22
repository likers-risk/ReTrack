import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Icons bundled with the app (works offline, no outside website needed)
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

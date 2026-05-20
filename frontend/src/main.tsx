import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Apply saved theme immediately to avoid flash
document.documentElement.setAttribute('data-theme', localStorage.getItem('hf-theme') || 'material')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import App from './App.jsx'
import { initialTheme } from './state/ThemeContext.jsx'
import './index.css'

// Apply the theme before first paint to avoid a flash.
document.documentElement.setAttribute('data-theme', initialTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ============================================================================================
// FILE: frontend/src/main.jsx
// PART OF: Front end > start
// WHAT IT DOES: Starting point of the React app: puts the app on the page with the router and the
//               login/session context.
// ============================================================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>,
)

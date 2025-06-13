// File: frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ✅ Path matches your folder “context”
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider must be *above* App so useAuth() has context */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

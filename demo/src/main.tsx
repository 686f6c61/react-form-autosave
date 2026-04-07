// Inicializa GlitchTip (Sentry-compatible). DSN inyectada en build via VITE_GLITCHTIP_DSN.
import * as __Sentry from '@sentry/browser';
const __dsn = import.meta.env.VITE_GLITCHTIP_DSN;
if (__dsn) {
  __Sentry.init({
    dsn: __dsn,
    release: 'react-form-autosave-demo',
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.01,
  });
}

/**
 * react-form-autosave demo
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

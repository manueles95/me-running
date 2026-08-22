import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted variable fonts (bundled at build → zero runtime network calls, §7).
import '@fontsource-variable/fraunces';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';

import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

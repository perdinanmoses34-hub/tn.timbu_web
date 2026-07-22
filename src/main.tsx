import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker to support offline caching and automatic Android/iOS installation prompts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Dynamically calculate the base directory path (e.g. '/' or '/repository-name/')
    const baseDir = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const swUrl = `${baseDir}sw.js`.replace(/\/+/g, '/');

    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

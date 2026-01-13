
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initFontOptimizations } from './src/utils/fontLoader';
import { serviceWorkerManager } from './src/utils/serviceWorkerManager';

// Initialize font loading optimizations early
initFontOptimizations();

// Register Service Worker for offline support and caching
if (import.meta.env.PROD) {
  serviceWorkerManager.register({
    onSuccess: (registration) => {
      console.log('Service Worker registered successfully');
    },
    onUpdate: (registration) => {
      console.log('New Service Worker available');
      // Optionally show a notification to the user
      if (confirm('A new version is available. Reload to update?')) {
        serviceWorkerManager.skipWaiting();
      }
    },
    onError: (error) => {
      console.error('Service Worker registration failed:', error);
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

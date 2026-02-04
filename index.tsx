import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './src/components/ErrorBoundary';

console.log('🚀 Starting Al Mizan Law Office Manager...');
console.log('📦 Environment:', import.meta.env.MODE);
console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Root element found');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('🎉 App rendered successfully');
/**
 * main.tsx — React application entry point.
 *
 * Mounts the React app into the #root element provided by index.html.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find #root element. Make sure index.html has <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

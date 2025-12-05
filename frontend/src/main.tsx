import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import KnowledgeBaseApp from './KnowledgeBaseApp.tsx';
import './index.css';

const isKnowledgeBaseWindow = window.location.pathname.startsWith('/kb');
const RootApp = isKnowledgeBaseWindow ? KnowledgeBaseApp : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

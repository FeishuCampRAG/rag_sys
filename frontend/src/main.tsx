import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import KnowledgeBaseApp from './KnowledgeBaseApp.tsx';
import Toast from './components/common/Toast';
import LoadingOverlay from './components/common/Loading';
import ConfirmModal from './components/modals/ConfirmModal';
import ChunkViewModal from './components/modals/ChunkViewModal';
import './index.css';

const isKnowledgeBaseWindow = window.location.pathname.startsWith('/kb');
const RootApp = isKnowledgeBaseWindow ? KnowledgeBaseApp : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
    <Toast />
    <LoadingOverlay />
    <ConfirmModal />
    <ChunkViewModal />
  </React.StrictMode>
);

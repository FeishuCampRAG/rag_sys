import Header from './components/layout/Header';
import MainLayout from './components/layout/MainLayout';
import Sidebar from './components/sidebar/Sidebar';
import ChatPanel from './components/chat/ChatPanel';
import RAGProcessPanel from './components/rag/RAGProcessPanel';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <MainLayout>
        <Sidebar />
        <ChatPanel />
        <RAGProcessPanel />
      </MainLayout>
    </div>
  );
}

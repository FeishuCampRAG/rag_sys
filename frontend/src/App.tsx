import Header from './components/layout/Header';
import MainLayout from './components/layout/MainLayout';
import ConversationSidebar from './components/conversation/ConversationSidebar';
import ChatPanel from './components/chat/ChatPanel';
import RAGProcessPanel from './components/rag/RAGProcessPanel';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <MainLayout>
        <ConversationSidebar />
        <ChatPanel />
        <RAGProcessPanel />
      </MainLayout>
    </div>
  );
}

import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import MainLayout from './components/layout/MainLayout';
import ConversationSidebar from './components/conversation/ConversationSidebar';
import ChatPanel from './components/chat/ChatPanel';
import RAGProcessPanel from './components/rag/RAGProcessPanel';

type MobileSection = 'conversations' | 'chat' | 'process';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<MobileSection>('chat');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (!event.matches) {
        setActiveMobileSection('chat');
      }
    };

    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const mobileSections: { key: MobileSection; label: string }[] = [
    { key: 'conversations', label: '会话' },
    { key: 'chat', label: '对话' },
    { key: 'process', label: '检索流程' }
  ];

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Header />
      {isMobile && (
        <div className="border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
          <div className="grid grid-cols-3 gap-2 text-sm font-medium">
            {mobileSections.map((section) => {
              const isActive = activeMobileSection === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveMobileSection(section.key)}
                  className={`rounded-md px-2 py-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <MainLayout>
        <ConversationSidebar
          style={{ display: !isMobile || activeMobileSection === 'conversations' ? undefined : 'none' }}
        />
        <ChatPanel
          style={{ display: !isMobile || activeMobileSection === 'chat' ? undefined : 'none' }}
        />
        <RAGProcessPanel
          style={{ display: !isMobile || activeMobileSection === 'process' ? undefined : 'none' }}
        />
      </MainLayout>
    </div>
  );
}

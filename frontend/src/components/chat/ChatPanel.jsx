import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import MessageList from './MessageList';
import InputArea from './InputArea';

export default function ChatPanel() {
  const loadHistory = useChatStore(state => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex-1 flex flex-col min-w-[400px] bg-white">
      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>
      <InputArea />
    </div>
  );
}

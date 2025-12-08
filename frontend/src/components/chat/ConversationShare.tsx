import { useState } from 'react';
import { useConversationStore } from '../../stores/conversationStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';

interface ConversationShareProps {
  conversationId?: string;
  className?: string;
}

export default function ConversationShare({ conversationId, className = '' }: ConversationShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'embed'>('link');
  
  const conversations = useConversationStore(state => state.conversations);
  const messages = useChatStore(state => state.messages);
  const showToast = useUIStore(state => state.showToast);
  const setLoading = useUIStore(state => state.setLoading);

  const currentConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : conversations.find(c => c.id === useConversationStore.getState().activeId);

  const conversationMessages = conversationId
    ? useChatStore.getState().messages
    : messages;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const generateShareableContent = () => {
    if (!currentConversation || !conversationMessages.length) return '';

    let content = `# ${currentConversation.summary || '对话分享'}\n\n`;
    content += `**分享时间**: ${formatTimestamp(new Date().toISOString())}\n`;
    content += `**对话时间**: ${formatTimestamp(currentConversation.created_at)}\n\n`;
    content += `---\n\n`;

    conversationMessages.forEach(message => {
      const role = message.role === 'user' ? '👤 用户' : '🤖 AI助手';
      content += `## ${role}\n\n`;
      content += `${message.content}\n\n`;
      
      if (message.references && message.references.length > 0) {
        content += `**引用来源**:\n`;
        message.references.forEach((ref, index) => {
          content += `- [${ref.index}] ${ref.document_name} (相似度: ${ref.similarity})\n`;
        });
        content += '\n';
      }
      
      content += `*${formatTimestamp(message.created_at)}*\n\n`;
      content += `---\n\n`;
    });

    return content;
  };

  const generateShareLink = async () => {
    // 这里应该调用后端API生成分享链接
    // 为了演示，我们生成一个模拟链接
    const mockShareId = Math.random().toString(36).substring(2, 15);
    const mockUrl = `${window.location.origin}/shared/${mockShareId}`;
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockUrl;
  };

  const generateEmbedCode = () => {
    const content = generateShareableContent();
    const encodedContent = encodeURIComponent(content);
    const embedUrl = `${window.location.origin}/embed?content=${encodedContent}`;
    
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  };

  const handleShare = async () => {
    if (!currentConversation) {
      showToast({
        type: 'error',
        message: '没有可分享的对话'
      });
      return;
    }

    setIsSharing(true);
    setLoading(true, '正在生成分享链接...');

    try {
      if (shareMethod === 'link') {
        const url = await generateShareLink();
        setShareUrl(url);
      } else {
        const embedCode = generateEmbedCode();
        setShareUrl(embedCode);
      }

      setShowShareDialog(true);
      showToast({
        type: 'success',
        message: '分享链接已生成'
      });
    } catch (error) {
      console.error('Share error:', error);
      showToast({
        type: 'error',
        message: '分享失败，请稍后重试'
      });
    } finally {
      setIsSharing(false);
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        type: 'success',
        message: '已复制到剪贴板'
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: '复制失败，请手动复制'
      });
    }
  };

  const copyShareLink = () => {
    copyToClipboard(shareUrl);
  };

  if (!currentConversation) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShareDialog(true)}
        disabled={isSharing}
      >
        {isSharing ? '生成中...' : '分享对话'}
      </Button>

      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">分享对话</h3>
            
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    shareMethod === 'link'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setShareMethod('link')}
                >
                  分享链接
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    shareMethod === 'embed'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setShareMethod('embed')}
                >
                  嵌入代码
                </button>
              </div>

              {!shareUrl ? (
                <div className="text-center py-8">
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-full"
                  >
                    {isSharing ? '生成中...' : '生成分享链接'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {shareMethod === 'link' ? '分享链接' : '嵌入代码'}
                    </label>
                    <div className="relative">
                      <textarea
                        value={shareUrl}
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 resize-none"
                        rows={shareMethod === 'embed' ? 4 : 2}
                      />
                      <button
                        onClick={copyShareLink}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                        title="复制"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowShareDialog(false);
                  setShareUrl('');
                }}
                className="flex-1"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
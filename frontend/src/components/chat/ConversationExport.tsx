import { useState } from 'react';
import { useConversationStore } from '../../stores/conversationStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';

type ExportFormat = 'markdown' | 'json' | 'txt';

interface ConversationExportProps {
  conversationId?: string;
  className?: string;
}

export default function ConversationExport({ conversationId, className = '' }: ConversationExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [showOptions, setShowOptions] = useState(false);
  
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

  const exportAsMarkdown = () => {
    if (!currentConversation || !conversationMessages.length) return '';

    let content = `# ${currentConversation.summary || '对话记录'}\n\n`;
    content += `**导出时间**: ${formatTimestamp(new Date().toISOString())}\n`;
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

  const exportAsJSON = () => {
    if (!currentConversation) return '';

    const exportData = {
      conversation: {
        id: currentConversation.id,
        title: currentConversation.title,
        summary: currentConversation.summary,
        created_at: currentConversation.created_at,
        updated_at: currentConversation.updated_at,
        message_count: currentConversation.message_count
      },
      messages: conversationMessages,
      exported_at: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportAsTXT = () => {
    if (!currentConversation || !conversationMessages.length) return '';

    let content = `${currentConversation.summary || '对话记录'}\n`;
    content += `导出时间: ${formatTimestamp(new Date().toISOString())}\n`;
    content += `对话时间: ${formatTimestamp(currentConversation.created_at)}\n`;
    content += `${'='.repeat(50)}\n\n`;

    conversationMessages.forEach(message => {
      const role = message.role === 'user' ? '[用户]' : '[AI助手]';
      content += `${role} ${formatTimestamp(message.created_at)}:\n`;
      content += `${message.content}\n\n`;
      
      if (message.references && message.references.length > 0) {
        content += `引用来源:\n`;
        message.references.forEach((ref, index) => {
          content += `  [${ref.index}] ${ref.document_name} (相似度: ${ref.similarity})\n`;
        });
        content += '\n';
      }
      
      content += `${'-'.repeat(30)}\n\n`;
    });

    return content;
  };


  const getExportContent = () => {
    switch (exportFormat) {
      case 'markdown':
        return exportAsMarkdown();
      case 'json':
        return exportAsJSON();
      case 'txt':
        return exportAsTXT();
      default:
        return exportAsMarkdown();
    }
  };

  const getFileExtension = () => {
    switch (exportFormat) {
      case 'markdown':
        return '.md';
      case 'json':
        return '.json';
      case 'txt':
        return '.txt';
      default:
        return '.md';
    }
  };

  const getMimeType = () => {
    switch (exportFormat) {
      case 'markdown':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'text/markdown';
    }
  };

  const handleExport = async () => {
    if (!currentConversation) {
      showToast({
        type: 'error',
        message: '没有可导出的对话'
      });
      return;
    }

    setIsExporting(true);
    setLoading(true, '正在导出对话...');

    try {
      const content = await getExportContent();
      const blob = new Blob([content], { type: getMimeType() });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentConversation.summary || '对话记录'}_${new Date().toISOString().slice(0, 10)}${getFileExtension()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        message: `对话已成功导出为${exportFormat.toUpperCase()}格式`
      });
    } catch (error) {
      console.error('Export error:', error);
      showToast({
        type: 'error',
        message: '导出失败，请稍后重试'
      });
    } finally {
      setIsExporting(false);
      setLoading(false);
      setShowOptions(false);
    }
  };

  if (!currentConversation) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
      >
        {isExporting ? '导出中...' : '导出对话'}
      </Button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">选择导出格式</h3>
            
            <div className="space-y-2 mb-4">
              {[
                { value: 'markdown', label: 'Markdown', description: '适合文档编辑和分享' },
                { value: 'json', label: 'JSON', description: '适合数据分析和备份' },
                { value: 'txt', label: '纯文本', description: '适合纯文本查看' }
              ].map(format => (
                <label key={format.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={exportFormat === format.value}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{format.label}</div>
                    <div className="text-xs text-gray-500">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptions(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? '导出中...' : '导出'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
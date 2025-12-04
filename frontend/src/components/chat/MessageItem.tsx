import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MessageItemProps } from '../../types';
import { Components } from 'react-markdown';

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  const referencedIndexes = new Set<number>();

  const renderContent = (content: string) => {
    // Enhanced regex to match various citation formats like [1], [2], [1,2], [1-3], etc.
    // This regex will match citations even when they're part of other text
    const processed = content.replace(/(\[)(\d+)(\])/g, (match, openBracket, numStr, closeBracket) => {
      const num = Number(numStr.trim());
      
      if (!Number.isFinite(num) || num <= 0) return match;
      
      referencedIndexes.add(num);
      return `<ref data-index="${num}">[${num}]</ref>`;
    });

    return (
      <ReactMarkdown
        className="prose prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-red-600 prose-blockquote:border-l-blue-200 prose-blockquote:text-gray-600"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        allowedElements={[
          'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'a', 'ref', 'span', 'br'
        ]}
        components={{
          code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; [key: string]: any }) => (
            inline ? (
              <code className="bg-gray-800/90 text-gray-100 px-1.5 py-0.5 rounded text-[12px]" {...props}>{children}</code>
            ) : (
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                <code {...props}>{children}</code>
              </pre>
            )
          ),
          a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: any }) => (
            <a className="text-blue-600 hover:text-blue-700 underline" href={href} target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          ),
          ref: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => {
            const index = Number(props['data-index']);

            const handleClick = () => {
              if (!Number.isFinite(index)) return;

              const card = document.getElementById(`ref-card-${index}`);
              if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('ring-2', 'ring-blue-200', 'bg-blue-50');
                setTimeout(() => {
                  card.classList.remove('ring-2', 'ring-blue-200', 'bg-blue-50');
                }, 600);
              }
            };

            return (
              <span
                {...props}
                onClick={handleClick}
                className="inline-flex items-center h-[22px] px-[2px] mx-1 text-[12px] font-semibold leading-none text-blue-700 bg-blue-100 border border-blue-200 rounded-md align-middle cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
              >
                {children}
              </span>
            );
          },
          li: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => <li className="leading-6" {...props}>{children}</li>,
          p: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => <p className="leading-6 mb-2 last:mb-0" {...props}>{children}</p>
        } as Components}
      >
        {processed}
      </ReactMarkdown>
    );
  };

  const contentNodes = renderContent(message.content);
  const usedReferences = (message.references || [])
    .filter(ref => Number.isFinite(ref.index) && referencedIndexes.has(ref.index));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
          AI
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[78%]`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
              : 'bg-gray-50 text-gray-800 border border-gray-100'
          }`}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
            {contentNodes}
            {message.streaming && (
              <span className={`inline-block w-2 h-4 ml-1 align-middle rounded-sm ${isUser ? 'bg-white/80' : 'bg-gray-400'} animate-pulse`} />
            )}
          </div>
        </div>

        {!isUser && usedReferences.length ? (
          <div className="mt-2 grid gap-2 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {usedReferences.map(ref => (
              <div
                key={ref.id}
                id={`ref-card-${ref.index}`}
                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 px-3 py-2 cursor-pointer group"
                onClick={() => {
                  // Copy content to clipboard
                  if (ref.content) {
                    navigator.clipboard.writeText(ref.content);
                    // Show a brief visual feedback
                    const element = document.getElementById(`ref-card-${ref.index}`);
                    if (element) {
                      element.classList.add('bg-blue-50', 'border-blue-300');
                      setTimeout(() => {
                        element.classList.remove('bg-blue-50', 'border-blue-300');
                      }, 500);
                    }
                  }
                }}
              >
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-200 transition-colors">
                    [{ref.index}]
                  </span>
                  <span className="font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{ref.document_name}</span>
                </div>
                {ref.content && (
                  <div className="text-xs text-gray-600 max-h-20 overflow-y-auto leading-relaxed group-hover:text-gray-700 transition-colors">
                    {ref.content}
                  </div>
                )}
                {typeof ref.similarity === 'number' && (
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>相似度</span>
                    <span className="font-medium text-blue-600">{Math.round(ref.similarity * 100)}%</span>
                  </div>
                )}
                <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  点击复制内容
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
          我
        </div>
      )}
    </div>
  );
}

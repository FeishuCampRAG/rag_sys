import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import type { MessageItemProps } from '../../types';

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  const referencedIndexes = new Set<number>();

  const renderContent = (content: string) => {
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
          code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; [key: string]: any }) =>
            inline ? (
              <code className="rounded bg-gray-800/90 px-1.5 py-0.5 text-[12px] text-gray-100" {...props}>{children}</code>
            ) : (
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-gray-100">
                <code {...props}>{children}</code>
              </pre>
            ),
          a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: any }) => (
            <a className="text-blue-600 underline transition hover:text-blue-700" href={href} target="_blank" rel="noreferrer" {...props}>
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
                className="mx-1 inline-flex h-[22px] cursor-pointer items-center justify-center rounded-md border border-blue-200 bg-blue-100 px-1 text-[12px] font-semibold text-blue-700 transition duration-150 hover:-translate-y-0.5 hover:shadow-sm"
              >
                {children}
              </span>
            );
          },
          li: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
            <li className="leading-6" {...props}>{children}</li>
          ),
          p: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
            <p className="mb-2 leading-6 last:mb-0" {...props}>{children}</p>
          )
        } as Components}
      >
        {processed}
      </ReactMarkdown>
    );
  };

  const contentNodes = renderContent(message.content);
  const usedReferences = (message.references || [])
    .filter(ref => Number.isFinite(ref.index) && referencedIndexes.has(ref.index as number));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isUser && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
          AI
        </div>
      )}
      <div className={`flex max-w-[78%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
              : 'border border-gray-100 bg-gray-50 text-gray-800'
          }`}
        >
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {contentNodes}
            {message.streaming && (
              <span className={`ml-1 inline-block h-4 w-2 animate-pulse rounded-sm align-middle ${isUser ? 'bg-white/80' : 'bg-gray-400'}`} />
            )}
          </div>
        </div>

        {!isUser && usedReferences.length > 0 ? (
          <div className="mt-2 grid w-full gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {usedReferences.map(ref => (
              <div
                key={ref.id}
                id={`ref-card-${ref.index}`}
                className="group cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                onClick={() => {
                  if (ref.content) {
                    navigator.clipboard.writeText(ref.content).catch(() => {
                      /* ignore copy errors */
                    });
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
                <div className="mb-1 flex items-center gap-2 text-gray-600">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 font-semibold text-blue-700 transition-colors group-hover:bg-blue-200">
                    [{ref.index}]
                  </span>
                  <span className="truncate font-semibold text-gray-800 transition-colors group-hover:text-blue-700">
                    {ref.document_name || '未命名文档'}
                  </span>
                </div>
                {ref.content && (
                  <div className="max-h-20 overflow-y-auto whitespace-pre-wrap leading-relaxed text-gray-600 transition-colors group-hover:text-gray-700">
                    {ref.content}
                  </div>
                )}
                {typeof ref.similarity === 'number' && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                    <span>相似度</span>
                    <span className="font-medium text-blue-600">{Math.round(ref.similarity * 100)}%</span>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                  点击可复制内容
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600">
          我
        </div>
      )}
    </div>
  );
}

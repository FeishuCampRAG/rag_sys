import { createPortal } from 'react-dom';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';

export default function ChunkViewModal() {
  const chunkView = useUIStore(state => state.chunkView);
  const closeChunkView = useUIStore(state => state.closeChunkView);
  const setActiveChunk = useUIStore(state => state.setActiveChunk);
  const showToast = useUIStore(state => state.showToast);

  if (!chunkView.open || !chunkView.chunks.length || typeof document === 'undefined') return null;

  const { chunks, activeIndex } = chunkView;
  const activeChunk = chunks[activeIndex] || chunks[0];

  const handleCopy = async () => {
    if (!activeChunk?.content) return;
    try {
      await navigator.clipboard.writeText(activeChunk.content);
      showToast({ type: 'success', message: '已复制到剪贴板' });
    } catch (error) {
      showToast({ type: 'error', message: error instanceof Error ? error.message : '复制失败' });
    }
  };

  const gotoPrev = () => setActiveChunk(Math.max(0, activeIndex - 1));
  const gotoNext = () => setActiveChunk(Math.min(chunks.length - 1, activeIndex + 1));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6">
      <div className="flex h-[75vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="hidden w-64 flex-col border-r border-gray-100 bg-gray-50 p-4 lg:flex">
          <div className="mb-3 text-sm font-semibold text-gray-600">检索 Chunks</div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {chunks.map((chunk, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={chunk.id}
                  type="button"
                  onClick={() => setActiveChunk(index)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                    isActive
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <div className="font-semibold">Chunk #{index + 1}</div>
                  <div className="truncate">{chunk.document_name}</div>
                  {typeof chunk.similarity === 'number' && (
                    <div className="mt-1 text-[11px] text-gray-400">相似度 {(chunk.similarity * 100).toFixed(1)}%</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{activeChunk.document_name}</p>
              <p className="text-xs text-gray-500">
                Chunk #{activeIndex + 1} · 相似度 {(activeChunk.similarity * 100).toFixed(2)}%
              </p>
            </div>
            <div className="flex gap-2">
              {activeChunk.content && (
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  复制内容
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={closeChunkView}>
                关闭
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm leading-relaxed text-gray-700 shadow-inner">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm">{activeChunk.content}</pre>
            </div>
            {activeChunk.metadata && (
              <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4 text-xs text-gray-500">
                <div className="mb-2 text-xs font-semibold text-gray-600">Metadata</div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(activeChunk.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            <div>
              Chunk {activeIndex + 1} / {chunks.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={gotoPrev} disabled={activeIndex === 0}>
                上一个
              </Button>
              <Button variant="outline" size="sm" onClick={gotoNext} disabled={activeIndex === chunks.length - 1}>
                下一个
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

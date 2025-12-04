import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import { LoadingIndicator } from '../common/Loading';
import { useDocumentStore } from '../../stores/documentStore';
import { useUIStore } from '../../stores/uiStore';

export default function ChunkViewModal() {
  const [mounted, setMounted] = useState(false);
  const { selectedDocId, selectedDocChunks, documents, chunksLoading, selectDocument } = useDocumentStore();
  const chunkView = useUIStore(state => state.chunkView);
  const closeChunkView = useUIStore(state => state.closeChunkView);
  const setActiveChunk = useUIStore(state => state.setActiveChunk);
  const showToast = useUIStore(state => state.showToast);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!selectedDocId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void selectDocument(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedDocId, selectDocument]);

  useEffect(() => {
    if (!chunkView.open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChunkView();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [chunkView.open, closeChunkView]);

  const selectedDocument = useMemo(
    () => documents.find(doc => doc.id === selectedDocId),
    [documents, selectedDocId]
  );

  const documentModalOpen = mounted && typeof document !== 'undefined' && Boolean(selectedDocId);
  const chunkViewOpen = typeof document !== 'undefined' && chunkView.open && chunkView.chunks.length > 0;

  if (!documentModalOpen && !chunkViewOpen) {
    return null;
  }

  const copyChunkContent = async (content: string) => {
    try {
      if (!navigator?.clipboard) {
        throw new Error('当前浏览器不支持复制到剪贴板');
      }
      await navigator.clipboard.writeText(content);
      showToast({ type: 'success', message: '片段内容已复制' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '复制失败，请稍后重试';
      showToast({ type: 'error', message });
    }
  };

  if (documentModalOpen && selectedDocId) {
    const closeModal = () => {
      void selectDocument(null);
    };
    const statusText =
      selectedDocument?.status === 'ready'
        ? '已就绪'
        : selectedDocument?.status === 'processing'
          ? '处理中'
          : '失败';

    return createPortal(
      <div className="fixed inset-0 z-[54] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-10 sm:py-16">
        <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Chunks 查看</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-800">
                {selectedDocument?.original_name || '未命名文档'}
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                {chunksLoading
                  ? '片段拉取中...'
                  : `共 ${selectedDocChunks.length} 个片段 · 文档状态：${statusText}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              关闭
            </Button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {chunksLoading ? (
              <LoadingIndicator label="片段加载中..." className="py-12" />
            ) : selectedDocChunks.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">暂无可展示的片段</div>
            ) : (
              <div className="space-y-4">
                {selectedDocChunks.map((chunk, index) => (
                  <div key={chunk.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-gray-700">
                          #{index + 1}
                        </span>
                        {typeof chunk.similarity === 'number' && <span>相似度 {chunk.similarity.toFixed(2)}</span>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyChunkContent(chunk.content)}>
                        复制内容
                      </Button>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{chunk.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const { chunks, activeIndex } = chunkView;
  const activeChunk = chunks[activeIndex] || chunks[0];

  const handleCopyActive = () => {
    if (!activeChunk?.content) return;
    void copyChunkContent(activeChunk.content);
  };

  const gotoPrev = () => setActiveChunk(Math.max(0, activeIndex - 1));
  const gotoNext = () => setActiveChunk(Math.min(chunks.length - 1, activeIndex + 1));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6">
      <div className="flex h-[75vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="hidden w-64 flex-col border-r border-gray-100 bg-gray-50 p-4 lg:flex">
          <div className="mb-3 text-sm font-semibold text-gray-600">检索到的 Chunks</div>
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
                <Button variant="ghost" size="sm" onClick={handleCopyActive}>
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

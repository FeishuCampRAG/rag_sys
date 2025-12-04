import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { useDocumentStore } from '../../stores/documentStore';
import { useToast } from '../../hooks/useToast';

export default function ChunkViewModal() {
  const [mounted, setMounted] = useState(false);
  const { selectedDocId, selectedDocChunks, documents, chunksLoading, selectDocument } = useDocumentStore();
  const toast = useToast();

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

  const selectedDocument = useMemo(
    () => documents.find(doc => doc.id === selectedDocId),
    [documents, selectedDocId]
  );

  if (!mounted || typeof document === 'undefined' || !selectedDocId) {
    return null;
  }

  const closeModal = () => {
    void selectDocument(null);
  };

  const copyChunk = async (content: string) => {
    try {
      if (!navigator?.clipboard) {
        throw new Error('浏览器不支持复制到剪贴板');
      }
      await navigator.clipboard.writeText(content);
      toast({
        type: 'success',
        title: '已复制',
        message: '片段内容已复制到剪贴板'
      });
    } catch (error) {
      toast({
        type: 'error',
        title: '复制失败',
        message: error instanceof Error ? error.message : '请稍后再试'
      });
    }
  };

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
                : `共 ${selectedDocChunks.length} 个片段 · 文档状态：${selectedDocument?.status === 'ready' ? '已就绪' : selectedDocument?.status === 'processing' ? '处理中' : '失败'}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={closeModal}>
            关闭
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {chunksLoading ? (
            <Loading label="片段加载中..." className="py-12" />
          ) : selectedDocChunks.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              暂无可展示的片段
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDocChunks.map((chunk, index) => (
                <div key={chunk.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-gray-700">
                        #{index + 1}
                      </span>
                      {typeof chunk.similarity === 'number' && (
                        <span>相似度 {chunk.similarity.toFixed(2)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyChunk(chunk.content)}
                    >
                      复制内容
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                    {chunk.content}
                  </p>
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

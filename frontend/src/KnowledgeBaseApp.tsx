import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import UploadButton from './components/sidebar/UploadButton';
import UploadArea from './components/sidebar/UploadArea';
import DocumentList from './components/sidebar/DocumentList';
import { useDocumentStore } from './stores/documentStore';
import { useSettingsStore } from './stores/settingsStore';
import { api } from './services/api';
import ChunkViewModal from './components/modals/ChunkViewModal';
import ConfirmModal from './components/modals/ConfirmModal';
import LoadingOverlay from './components/common/Loading';
import ToastContainer from './components/common/Toast';
import UploadProgressModal from './components/modals/UploadProgressModal';
import type { EmbeddingInfo } from './types';

export default function KnowledgeBaseApp() {
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);
  const fetchSettings = useSettingsStore(state => state.fetchSettings);
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchSettings();
    void api.getEmbeddingInfo().then(res => {
      if (res.success && res.data) {
        setEmbeddingInfo(res.data);
      }
    }).catch(() => {});
  }, [fetchDocuments, fetchSettings]);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header variant="knowledge" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-800">知识库管理</h2>
                <p className="text-sm text-gray-500">上传文档、查看状态并维护知识库资源</p>
              </div>
              <div className="sm:w-auto">
                <UploadButton />
              </div>
            </div>

            {embeddingInfo && (
              <div className={`mt-3 rounded-lg border px-3 py-3 text-sm ${embeddingInfo.mismatch ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">当前嵌入模型：{embeddingInfo.currentModel}</span>
                  <span className="text-xs text-gray-500">维度：{embeddingInfo.dimension}</span>
                </div>
                {embeddingInfo.mismatch && (
                  <p className="mt-1 text-xs">
                    检测到嵌入模型已更换，建议删除现有文档并重新上传，以使用新模型生成向量。
                  </p>
                )}
              </div>
            )}

            <UploadArea />

            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="max-h-[420px] min-h-[200px] overflow-y-auto pr-1">
                  <DocumentList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChunkViewModal />
      <ConfirmModal />
      <UploadProgressModal />
      <ToastContainer />
      <LoadingOverlay />
    </div>
  );
}

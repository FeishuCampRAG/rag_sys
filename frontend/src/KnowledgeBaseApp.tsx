import { useEffect } from 'react';
import Header from './components/layout/Header';
import UploadButton from './components/sidebar/UploadButton';
import UploadArea from './components/sidebar/UploadArea';
import UploadProgress from './components/sidebar/UploadProgress';
import DocumentList from './components/sidebar/DocumentList';
import DocumentViewer from './components/sidebar/DocumentViewer';
import { useDocumentStore } from './stores/documentStore';
import ChunkViewModal from './components/modals/ChunkViewModal';
import ConfirmModal from './components/modals/ConfirmModal';
import ToastContainer from './components/common/Toast';

export default function KnowledgeBaseApp() {
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

            <UploadArea />
            <UploadProgress />

            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="lg:w-5/12">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <DocumentList />
                  </div>
                </div>
                <div className="lg:flex-1">
                  <DocumentViewer />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChunkViewModal />
      <ConfirmModal />
      <ToastContainer />
    </div>
  );
}

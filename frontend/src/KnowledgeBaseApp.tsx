import { useEffect } from 'react';
import Header from './components/layout/Header';
import UploadButton from './components/sidebar/UploadButton';
import UploadArea from './components/sidebar/UploadArea';
import UploadProgress from './components/sidebar/UploadProgress';
import DocumentList from './components/sidebar/DocumentList';
import { useDocumentStore } from './stores/documentStore';

export default function KnowledgeBaseApp() {
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header variant="knowledge" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-6 px-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">知识库管理</h2>
                <p className="text-sm text-gray-500">上传文档、查看状态与维护知识库</p>
              </div>
              <UploadButton />
            </div>

            <UploadArea />
            <UploadProgress />

            <div className="mt-6 border-t border-gray-100 pt-4">
              <DocumentList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

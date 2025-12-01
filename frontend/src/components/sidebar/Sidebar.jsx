import { useEffect } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import UploadButton from './UploadButton';
import DocumentList from './DocumentList';

export default function Sidebar() {
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="w-64 min-w-[200px] bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">知识库管理</h2>
        <UploadButton />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DocumentList />
      </div>
    </div>
  );
}

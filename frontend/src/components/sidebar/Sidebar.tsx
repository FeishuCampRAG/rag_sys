import { useEffect } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import UploadButton from './UploadButton';
import UploadArea from './UploadArea';
import DocumentList from './DocumentList';

export default function Sidebar() {
  const fetchDocuments = useDocumentStore(state => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex min-w-[200px] w-64 flex-col border-r border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-600">知识库管理</h2>
        <UploadButton />
        <UploadArea />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DocumentList />
      </div>
    </div>
  );
}

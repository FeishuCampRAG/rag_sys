import { useDocumentStore } from '../../stores/documentStore';
import DocumentItem from './DocumentItem';

export default function DocumentList() {
  const documents = useDocumentStore(state => state.documents);

  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        暂无文档，请上传
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <DocumentItem key={doc.id} document={doc} />
      ))}
    </div>
  );
}

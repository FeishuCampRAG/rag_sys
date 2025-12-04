import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore';

export default function LoadingOverlay() {
  const { open, message } = useUIStore(state => state.loading);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white/95 px-6 py-5 shadow-xl">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        {message ? (
          <p className="text-sm font-medium text-gray-700">{message}</p>
        ) : (
          <p className="text-sm text-gray-500">处理中，请稍候...</p>
        )}
      </div>
    </div>,
    document.body
  );
}

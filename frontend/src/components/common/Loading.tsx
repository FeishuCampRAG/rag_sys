import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore';

export interface LoadingIndicatorProps {
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export function LoadingIndicator({ label = '加载中', fullscreen = false, className = '' }: LoadingIndicatorProps) {
  const content = (
    <div className={`flex items-center justify-center gap-2 text-sm text-gray-600 ${className}`.trim()}>
      <svg className="h-5 w-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>{label}</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

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

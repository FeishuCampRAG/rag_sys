import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore';
import type { ToastMessage, ToastType } from '../../types';

const styleMap: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700'
};

const iconMap: Record<ToastType, string> = {
  success: '✅',
  info: 'ℹ️',
  error: '⚠️',
  warning: '⚠️'
};

const DEFAULT_DURATION = 3200;

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md transition ${styleMap[toast.type]}`}
    >
      <span className="text-lg leading-none">{iconMap[toast.type]}</span>
      <div className="flex-1 text-sm">
        {toast.title && <div className="font-semibold">{toast.title}</div>}
        <div>{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-xs text-inherit opacity-60 transition hover:opacity-100"
        aria-label="关闭提示"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore(state => state.toastQueue);
  const hideToast = useUIStore(state => state.hideToast);

  useEffect(() => {
    const timers = toasts.map(toast => {
      if (toast.duration === Infinity) return null;
      return window.setTimeout(() => hideToast(toast.id), toast.duration ?? DEFAULT_DURATION);
    });
    return () => {
      timers.forEach(timer => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [toasts, hideToast]);

  if (!toasts.length || typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={hideToast} />
        </div>
      ))}
    </div>,
    document.body
  );
}

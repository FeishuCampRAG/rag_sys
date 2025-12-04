import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ToastMessage } from '../../types';
import { useUIStore } from '../../stores/uiStore';

const typeStyles = {
  info: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    ),
    border: 'border-blue-200',
    bg: 'bg-blue-50/80',
    text: 'text-blue-800'
  },
  success: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    border: 'border-green-200',
    bg: 'bg-green-50/80',
    text: 'text-green-800'
  },
  warning: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5l7 12H5l7-12z" />
      </svg>
    ),
    border: 'border-yellow-200',
    bg: 'bg-yellow-50/80',
    text: 'text-yellow-800'
  },
  error: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    border: 'border-red-200',
    bg: 'bg-red-50/80',
    text: 'text-red-800'
  }
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
  const animationMs = 220;

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(() => onDismiss(toast.id), animationMs);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => handleClose(), toast.duration ?? 2600);
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.duration]);

  const styles = typeStyles[toast.type];
  const visibilityClasses = visible
    ? 'opacity-100 translate-y-0 scale-100'
    : 'opacity-0 -translate-y-2 scale-95';

  return (
    <div
      className={`pointer-events-auto flex min-w-[240px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-all duration-200 ease-out ${styles.border} ${styles.bg} ${visibilityClasses}`}
    >
      <div className={`rounded-full bg-white/80 p-1 ${styles.text}`}>
        {styles.icon}
      </div>
      <div className="flex-1 text-sm text-gray-700">
        {toast.title && <div className={`text-xs font-semibold ${styles.text}`}>{toast.title}</div>}
        <div className="mt-0.5 text-xs text-gray-600">{toast.message}</div>
      </div>
      <button
        className="mt-0.5 text-gray-400 transition hover:text-gray-600"
        onClick={handleClose}
        aria-label="关闭"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore(state => state.toasts);
  const removeToast = useUIStore(state => state.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>,
    document.body
  );
}

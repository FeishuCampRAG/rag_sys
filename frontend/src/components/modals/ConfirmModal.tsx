import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';

export default function ConfirmModal() {
  const dialog = useUIStore(state => state.confirmDialog);
  const resolve = useUIStore(state => state.resolveConfirm);

  useEffect(() => {
    if (!dialog) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resolve(false);
      }
      if (event.key === 'Enter') {
        resolve(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dialog, resolve]);

  if (!dialog || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {dialog.title && <h3 className="text-base font-semibold text-gray-800">{dialog.title}</h3>}
        <p className="mt-3 text-sm text-gray-600">{dialog.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => resolve(false)}>
            {dialog.cancelText || '取消'}
          </Button>
          <Button variant={dialog.danger ? 'danger' : 'primary'} onClick={() => resolve(true)}>
            {dialog.confirmText || '确定'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

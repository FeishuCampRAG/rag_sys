import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';

export default function ConfirmModal() {
  const confirm = useUIStore(state => state.confirm);
  const closeConfirm = useUIStore(state => state.closeConfirm);
  const showToast = useUIStore(state => state.showToast);
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = () => {
    if (submitting) return;
    confirm.onCancel?.();
    closeConfirm();
  };

  const handleConfirm = async () => {
    if (!confirm.onConfirm) {
      closeConfirm();
      return;
    }
    setSubmitting(true);
    try {
      await confirm.onConfirm();
      closeConfirm();
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败，请稍后重试';
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!confirm.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (submitting) return;
        confirm.onCancel?.();
        closeConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirm.open, submitting, confirm.onCancel, closeConfirm]);

  if (!confirm.open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              confirm.danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {confirm.danger ? '⚠️' : '💡'}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{confirm.title}</h3>
            {confirm.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                {confirm.description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel} disabled={submitting}>
            {confirm.cancelText || '取消'}
          </Button>
          <Button
            variant={confirm.danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={submitting}
          >
            {confirm.confirmText || '确认'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

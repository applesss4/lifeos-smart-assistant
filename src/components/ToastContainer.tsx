import React from 'react';
import { Toast } from './UIFeedback';
import { ToastItem } from '../hooks/useToast';

/**
 * Toast 容器组件
 * 用于在应用顶层显示所有 Toast 通知
 */
interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <div key={toast.id}>
          <Toast
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

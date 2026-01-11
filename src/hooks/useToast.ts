import { useState, useCallback } from 'react';
import { MessageType } from '../components/UIFeedback';

/**
 * Toast 通知项
 */
export interface ToastItem {
  id: string;
  type: MessageType;
  message: string;
  duration?: number;
}

/**
 * Toast 通知管理 Hook
 * 用于在应用中显示临时通知消息
 * 
 * 实现需求: 5.4, 5.5, 9.4, 9.5
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /**
   * 显示 Toast 通知
   */
  const showToast = useCallback((type: MessageType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // 自动移除 Toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * 移除 Toast 通知
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 显示成功消息
   */
  const success = useCallback((message: string, duration?: number) => {
    return showToast('success', message, duration);
  }, [showToast]);

  /**
   * 显示错误消息
   */
  const error = useCallback((message: string, duration?: number) => {
    return showToast('error', message, duration);
  }, [showToast]);

  /**
   * 显示警告消息
   */
  const warning = useCallback((message: string, duration?: number) => {
    return showToast('warning', message, duration);
  }, [showToast]);

  /**
   * 显示信息消息
   */
  const info = useCallback((message: string, duration?: number) => {
    return showToast('info', message, duration);
  }, [showToast]);

  /**
   * 清除所有 Toast
   */
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
}

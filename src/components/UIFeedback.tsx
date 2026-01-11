import React from 'react';

/**
 * 加载指示器组件
 * 用于显示加载状态
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="加载中"
    />
  );
}

/**
 * 全屏加载指示器
 * 用于页面级别的加载状态
 */
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = '加载中...' }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" color="primary" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * 消息提示类型
 */
export type MessageType = 'success' | 'error' | 'warning' | 'info';

/**
 * 消息提示组件
 * 用于显示操作结果反馈
 */
interface MessageProps {
  type: MessageType;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Message({ type, message, onClose, className = '' }: MessageProps) {
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      icon: 'check_circle',
      iconColor: 'text-green-500'
    },
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      icon: 'error',
      iconColor: 'text-red-500'
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      icon: 'warning',
      iconColor: 'text-yellow-500'
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      icon: 'info',
      iconColor: 'text-blue-500'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 flex items-start gap-3 ${className}`}
      role="alert"
    >
      <span className={`material-symbols-outlined ${config.iconColor} text-xl flex-shrink-0`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${config.textColor} font-medium break-words`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="关闭消息"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

/**
 * Toast 通知组件
 * 用于显示临时的操作反馈
 */
interface ToastProps {
  type: MessageType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ type, message, duration = 3000, onClose }: ToastProps) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: 'bg-green-500',
      icon: 'check_circle'
    },
    error: {
      bgColor: 'bg-red-500',
      icon: 'error'
    },
    warning: {
      bgColor: 'bg-yellow-500',
      icon: 'warning'
    },
    info: {
      bgColor: 'bg-blue-500',
      icon: 'info'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed top-4 right-4 ${config.bgColor} text-white rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-md z-50 animate-slide-in-right`}
      role="alert"
    >
      <span className="material-symbols-outlined text-xl flex-shrink-0">{config.icon}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="hover:opacity-70 transition-opacity flex-shrink-0"
        aria-label="关闭通知"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

/**
 * 按钮加载状态组件
 * 用于按钮内的加载指示
 */
interface ButtonLoadingProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function ButtonLoading({ loading, loadingText = '处理中...', children }: ButtonLoadingProps) {
  if (loading) {
    return (
      <span className="flex items-center justify-center gap-2">
        <LoadingSpinner size="sm" color="white" />
        <span>{loadingText}</span>
      </span>
    );
  }
  return <>{children}</>;
}

/**
 * 空状态组件
 * 用于显示无数据状态
 */
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <span className="material-symbols-outlined text-gray-400 text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * 骨架屏组件
 * 用于内容加载时的占位
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export function Skeleton({ 
  className = '', 
  variant = 'text', 
  width = '100%', 
  height = variant === 'text' ? '1rem' : '100%' 
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-label="加载中"
    />
  );
}

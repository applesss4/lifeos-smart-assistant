import React, { ComponentType, ReactNode, Suspense, lazy } from 'react';

/**
 * 懒加载工具模块
 * 提供统一的懒加载组件包装器、加载状态和错误处理
 * 需求: 2.3 - 实现懒加载技术按需加载视图组件
 */

/**
 * 错误边界组件
 * 捕获懒加载组件的加载错误并提供友好的错误提示
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

class LazyLoadErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('懒加载组件错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background-light dark:bg-background-dark">
          <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 max-w-md w-full text-center">
            <div className="size-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">加载失败</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              组件加载时出现错误，请重试
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 统一的加载 Fallback 组件
 * 显示加载状态，可以自定义加载消息
 */
interface LoadingFallbackProps {
  message?: string;
  minimal?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = '加载中...', 
  minimal = false 
}) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      </div>
    </div>
  );
};

/**
 * 懒加载高阶组件包装器
 * 为懒加载组件提供统一的加载状态和错误处理
 * 
 * @param importFn - 动态导入函数
 * @param fallback - 自定义加载状态组件
 * @param onRetry - 错误重试回调
 * @returns 包装后的懒加载组件
 * 
 * @example
 * const LazyHome = withLazyLoad(() => import('./views/Home'));
 * const LazyTasks = withLazyLoad(
 *   () => import('./views/Tasks'),
 *   <LoadingFallback message="加载任务..." />
 * );
 */
export function withLazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode,
  onRetry?: () => void
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <LazyLoadErrorBoundary fallback={fallback} onRetry={onRetry}>
      <Suspense fallback={fallback || <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}

/**
 * 创建带有自定义加载状态的懒加载组件
 * 
 * @param importFn - 动态导入函数
 * @param loadingMessage - 加载消息
 * @param customSkeleton - 自定义骨架屏组件
 * @returns 懒加载组件
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingMessage?: string,
  customSkeleton?: ReactNode
): ComponentType<React.ComponentProps<T>> {
  const fallback = customSkeleton || <LoadingFallback message={loadingMessage} />;
  
  return withLazyLoad(
    importFn,
    fallback
  );
}

/**
 * 导出错误边界组件供外部使用
 */
export { LazyLoadErrorBoundary };

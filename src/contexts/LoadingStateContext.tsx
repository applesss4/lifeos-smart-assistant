import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * 加载状态类型
 */
type LoadingState = {
  [key: string]: boolean;
};

/**
 * 加载状态上下文类型
 */
interface LoadingStateContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isAnyLoading: () => boolean;
  clearAll: () => void;
}

/**
 * 加载状态上下文
 * 用于全局协调加载状态，避免多个加载指示器同时显示
 */
const LoadingStateContext = createContext<LoadingStateContextType | undefined>(undefined);

/**
 * 加载状态提供者组件
 */
export const LoadingStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  /**
   * 设置特定键的加载状态
   */
  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates((prev) => {
      if (isLoading) {
        return { ...prev, [key]: true };
      } else {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      }
    });
  }, []);

  /**
   * 检查是否有任何加载状态
   */
  const isAnyLoading = useCallback(() => {
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  /**
   * 清除所有加载状态
   */
  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  const value = {
    loadingStates,
    setLoading,
    isAnyLoading,
    clearAll,
  };

  return (
    <LoadingStateContext.Provider value={value}>
      {children}
    </LoadingStateContext.Provider>
  );
};

/**
 * 使用加载状态的Hook
 */
export const useLoadingState = () => {
  const context = useContext(LoadingStateContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingStateProvider');
  }
  return context;
};

/**
 * 使用特定键的加载状态Hook
 * 自动管理加载状态的设置和清除
 */
export const useLoading = (key: string) => {
  const { loadingStates, setLoading } = useLoadingState();
  
  const isLoading = loadingStates[key] || false;
  
  const startLoading = useCallback(() => {
    setLoading(key, true);
  }, [key, setLoading]);
  
  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
  };
};

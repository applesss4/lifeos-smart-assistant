import { useState, useEffect, useCallback } from 'react';
import {
  getMemoryInfo,
  isLowMemoryDevice,
  memoryMonitor,
  memoryManager,
  MemoryInfo,
  MemoryLevel,
  MemoryCacheConfig
} from '../utils/memoryManager';

/**
 * Hook for memory management
 * 监控设备内存并提供内存优化建议
 */
export function useMemoryManagement() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo>(() => getMemoryInfo());
  const [cacheConfig, setCacheConfig] = useState<MemoryCacheConfig>(() => 
    memoryManager.getCacheConfig()
  );

  useEffect(() => {
    // 订阅内存变化
    const unsubscribe = memoryMonitor.subscribe((info) => {
      setMemoryInfo(info);
      setCacheConfig(memoryManager.getCacheConfig());
    });

    return unsubscribe;
  }, []);

  // 手动触发清理
  const cleanup = useCallback(() => {
    memoryManager.cleanup();
  }, []);

  return {
    memoryInfo,
    cacheConfig,
    isLowMemory: memoryInfo.isLowMemory,
    memoryLevel: memoryInfo.level,
    cleanup
  };
}

/**
 * Hook to check if device is low memory
 */
export function useIsLowMemory(): boolean {
  const [isLow, setIsLow] = useState(() => isLowMemoryDevice());

  useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe((info) => {
      setIsLow(info.isLowMemory);
    });

    return unsubscribe;
  }, []);

  return isLow;
}

/**
 * Hook for memory level
 */
export function useMemoryLevel(): MemoryLevel {
  const [level, setLevel] = useState<MemoryLevel>(() => getMemoryInfo().level);

  useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe((info) => {
      setLevel(info.level);
    });

    return unsubscribe;
  }, []);

  return level;
}

/**
 * Hook to register cleanup callback
 * 注册在低内存时自动执行的清理函数
 */
export function useMemoryCleanup(cleanupFn: () => void): void {
  useEffect(() => {
    const unregister = memoryManager.registerCleanupCallback(cleanupFn);
    return unregister;
  }, [cleanupFn]);
}

/**
 * Hook for adaptive cache size based on memory
 */
export function useAdaptiveCacheSize(): number {
  const [maxSize, setMaxSize] = useState(() => memoryManager.getCacheConfig().maxCacheSize);

  useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe(() => {
      const config = memoryManager.getCacheConfig();
      setMaxSize(config.maxCacheSize);
    });

    return unsubscribe;
  }, []);

  return maxSize;
}

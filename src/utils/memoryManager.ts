/**
 * 内存管理工具
 * 监控设备内存并在低内存设备上优化性能
 */

export type MemoryLevel = 'high' | 'medium' | 'low' | 'critical';

export interface MemoryInfo {
  deviceMemory?: number; // GB
  level: MemoryLevel;
  isLowMemory: boolean;
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

/**
 * 获取设备内存信息
 */
export function getDeviceMemory(): number | undefined {
  // Navigator.deviceMemory API (Chrome, Edge)
  return (navigator as any).deviceMemory;
}

/**
 * 获取JS堆内存使用情况
 */
export function getJSHeapInfo(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} {
  const performance = (window.performance as any);
  
  if (performance && performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }
  
  return {};
}

/**
 * 确定内存级别
 */
export function getMemoryLevel(): MemoryLevel {
  const deviceMemory = getDeviceMemory();
  const heapInfo = getJSHeapInfo();
  
  // 如果有设备内存信息
  if (deviceMemory !== undefined) {
    if (deviceMemory >= 8) return 'high';
    if (deviceMemory >= 4) return 'medium';
    if (deviceMemory >= 2) return 'low';
    return 'critical';
  }
  
  // 如果有堆内存信息，根据使用率判断
  if (heapInfo.usedJSHeapSize && heapInfo.jsHeapSizeLimit) {
    const usageRatio = heapInfo.usedJSHeapSize / heapInfo.jsHeapSizeLimit;
    
    if (usageRatio < 0.5) return 'high';
    if (usageRatio < 0.7) return 'medium';
    if (usageRatio < 0.85) return 'low';
    return 'critical';
  }
  
  // 默认假设中等内存
  return 'medium';
}

/**
 * 获取完整的内存信息
 */
export function getMemoryInfo(): MemoryInfo {
  const deviceMemory = getDeviceMemory();
  const heapInfo = getJSHeapInfo();
  const level = getMemoryLevel();
  
  return {
    deviceMemory,
    level,
    isLowMemory: level === 'low' || level === 'critical',
    ...heapInfo
  };
}

/**
 * 检查是否为低内存设备
 */
export function isLowMemoryDevice(): boolean {
  const level = getMemoryLevel();
  return level === 'low' || level === 'critical';
}

/**
 * 根据内存级别获取缓存配置
 */
export interface MemoryCacheConfig {
  maxCacheSize: number; // 最大缓存条目数
  ttl: number; // 缓存生存时间（毫秒）
  enablePrefetch: boolean; // 是否启用预取
  enableBackgroundRefresh: boolean; // 是否启用后台刷新
}

export function getCacheConfigForMemory(level: MemoryLevel): MemoryCacheConfig {
  switch (level) {
    case 'high':
      return {
        maxCacheSize: 100,
        ttl: 5 * 60 * 1000, // 5分钟
        enablePrefetch: true,
        enableBackgroundRefresh: true
      };
    
    case 'medium':
      return {
        maxCacheSize: 50,
        ttl: 3 * 60 * 1000, // 3分钟
        enablePrefetch: true,
        enableBackgroundRefresh: false
      };
    
    case 'low':
      return {
        maxCacheSize: 20,
        ttl: 2 * 60 * 1000, // 2分钟
        enablePrefetch: false,
        enableBackgroundRefresh: false
      };
    
    case 'critical':
      return {
        maxCacheSize: 10,
        ttl: 1 * 60 * 1000, // 1分钟
        enablePrefetch: false,
        enableBackgroundRefresh: false
      };
  }
}

/**
 * 内存压力监控器
 */
export class MemoryPressureMonitor {
  private listeners: Array<(info: MemoryInfo) => void> = [];
  private intervalId?: number;
  private checkInterval: number = 30000; // 30秒检查一次

  /**
   * 开始监控
   */
  start(): void {
    if (this.intervalId) return; // 已经在运行

    // 立即检查一次
    this.check();

    // 定期检查
    this.intervalId = window.setInterval(() => {
      this.check();
    }, this.checkInterval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * 执行内存检查
   */
  private check(): void {
    const memoryInfo = getMemoryInfo();
    this.notifyListeners(memoryInfo);
  }

  /**
   * 订阅内存变化
   */
  subscribe(listener: (info: MemoryInfo) => void): () => void {
    this.listeners.push(listener);
    
    // 立即通知当前状态
    listener(getMemoryInfo());
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(info: MemoryInfo): void {
    this.listeners.forEach(listener => {
      listener(info);
    });
  }

  /**
   * 设置检查间隔
   */
  setCheckInterval(interval: number): void {
    this.checkInterval = interval;
    
    // 如果正在运行，重启以应用新间隔
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }
}

/**
 * 全局内存监控器实例
 */
export const memoryMonitor = new MemoryPressureMonitor();

/**
 * 清理不需要的数据
 */
export function cleanupUnusedData(): void {
  // 触发垃圾回收（如果可用）
  if ((window as any).gc) {
    try {
      (window as any).gc();
    } catch (e) {
      console.warn('Manual GC not available');
    }
  }
  
  // 清理控制台日志（在生产环境）
  if (process.env.NODE_ENV === 'production') {
    console.clear();
  }
}

/**
 * 内存管理器
 */
export class MemoryManager {
  private cacheConfig: MemoryCacheConfig;
  private cleanupCallbacks: Array<() => void> = [];

  constructor() {
    const memoryInfo = getMemoryInfo();
    this.cacheConfig = getCacheConfigForMemory(memoryInfo.level);
    
    // 开始监控内存
    memoryMonitor.subscribe((info) => {
      this.handleMemoryChange(info);
    });
    
    memoryMonitor.start();
  }

  /**
   * 处理内存变化
   */
  private handleMemoryChange(info: MemoryInfo): void {
    const newConfig = getCacheConfigForMemory(info.level);
    
    // 如果内存级别降低，触发清理
    if (info.level === 'low' || info.level === 'critical') {
      this.triggerCleanup();
    }
    
    this.cacheConfig = newConfig;
  }

  /**
   * 获取当前缓存配置
   */
  getCacheConfig(): MemoryCacheConfig {
    return { ...this.cacheConfig };
  }

  /**
   * 注册清理回调
   */
  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.push(callback);
    
    return () => {
      const index = this.cleanupCallbacks.indexOf(callback);
      if (index > -1) {
        this.cleanupCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 触发清理
   */
  private triggerCleanup(): void {
    console.log('Triggering memory cleanup due to low memory');
    
    // 执行所有注册的清理回调
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    
    // 执行通用清理
    cleanupUnusedData();
  }

  /**
   * 手动触发清理
   */
  cleanup(): void {
    this.triggerCleanup();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    memoryMonitor.stop();
    this.cleanupCallbacks = [];
  }
}

/**
 * 全局内存管理器实例
 */
export const memoryManager = new MemoryManager();

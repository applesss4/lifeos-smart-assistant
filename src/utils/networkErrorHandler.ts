/**
 * 网络错误处理工具
 * 提供网络连接检查、重试机制和离线状态处理
 * 需求: 9.1, 9.2
 */

import { ErrorRecoveryStrategy } from './authErrors';
import { errorLogger } from './errorLogger';

// 网络状态类型
export type NetworkStatus = 'online' | 'offline' | 'slow';

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

// 网络错误处理器类
export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private networkStatus: NetworkStatus = 'online';
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  // 获取单例实例
  public static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  // 初始化网络监控
  private initializeNetworkMonitoring(): void {
    // 监听在线/离线事件
    window.addEventListener('online', () => {
      errorLogger.info('网络已连接', 'network');
      this.updateNetworkStatus('online');
    });

    window.addEventListener('offline', () => {
      errorLogger.warn('网络已断开', 'network');
      this.updateNetworkStatus('offline');
    });

    // 初始化网络状态
    this.updateNetworkStatus(navigator.onLine ? 'online' : 'offline');

    // 定期检查网络连接质量
    this.startConnectionQualityCheck();
  }

  // 定期检查网络连接质量
  private startConnectionQualityCheck(): void {
    setInterval(async () => {
      if (navigator.onLine) {
        const quality = await this.checkConnectionQuality();
        if (quality === 'slow' && this.networkStatus !== 'slow') {
          errorLogger.warn('网络连接缓慢', 'network');
          this.updateNetworkStatus('slow');
        } else if (quality === 'good' && this.networkStatus === 'slow') {
          errorLogger.info('网络连接恢复正常', 'network');
          this.updateNetworkStatus('online');
        }
      }
    }, 30000); // 每30秒检查一次
  }

  // 检查网络连接质量
  private async checkConnectionQuality(): Promise<'good' | 'slow'> {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      const endTime = Date.now();
      const latency = endTime - startTime;

      // 如果延迟超过3秒，认为网络缓慢
      return latency > 3000 ? 'slow' : 'good';
    } catch (error) {
      return 'slow';
    }
  }

  // 更新网络状态
  private updateNetworkStatus(status: NetworkStatus): void {
    if (this.networkStatus !== status) {
      this.networkStatus = status;
      this.notifyListeners(status);
    }
  }

  // 通知所有监听器
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  // 订阅网络状态变化
  public onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    // 立即调用一次以获取当前状态
    callback(this.networkStatus);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  // 获取当前网络状态
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  // 检查是否在线
  public isOnline(): boolean {
    return this.networkStatus !== 'offline';
  }

  // 计算重试延迟
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    if (config.backoffStrategy === 'exponential') {
      // 指数退避: initialDelay * 2^attempt
      delay = config.initialDelay * Math.pow(2, attempt);
    } else {
      // 线性退避: initialDelay * (attempt + 1)
      delay = config.initialDelay * (attempt + 1);
    }

    // 限制最大延迟
    return Math.min(delay, config.maxDelay);
  }

  // 等待指定时间
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 带重试的操作执行
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    strategy: ErrorRecoveryStrategy
  ): Promise<T> {
    const config: RetryConfig = {
      maxRetries: strategy.maxRetries,
      backoffStrategy: strategy.backoffStrategy,
      initialDelay: 1000, // 1秒
      maxDelay: 10000 // 10秒
    };

    let lastError: Error | null = null;
    const currentAttempt = this.retryAttempts.get(operationId) || 0;

    for (let attempt = currentAttempt; attempt <= config.maxRetries; attempt++) {
      try {
        // 检查网络状态
        if (!this.isOnline()) {
          throw new Error('网络连接不可用，请检查网络设置');
        }

        // 执行操作
        const result = await operation();
        
        // 成功后清除重试计数
        this.retryAttempts.delete(operationId);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // 记录重试次数
        this.retryAttempts.set(operationId, attempt + 1);

        // 如果是最后一次尝试，抛出错误
        if (attempt >= config.maxRetries) {
          errorLogger.logError(
            `操作失败 (${operationId}): 已达到最大重试次数 ${config.maxRetries}`,
            'network',
            lastError,
            { operationId, attempts: attempt + 1 }
          );
          this.retryAttempts.delete(operationId);
          throw lastError;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt, config);
        
        errorLogger.warn(
          `操作失败 (${operationId}), 第 ${attempt + 1}/${config.maxRetries} 次重试`,
          'network',
          { operationId, delay, attempt: attempt + 1, maxRetries: config.maxRetries },
          lastError
        );

        // 等待后重试
        await this.wait(delay);
      }
    }

    // 理论上不会到达这里，但为了类型安全
    throw lastError || new Error('操作失败');
  }

  // 检查网络连接
  public async checkNetworkConnection(): Promise<boolean> {
    try {
      // 尝试访问一个可靠的端点
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      errorLogger.logError('网络连接检查失败', 'network', error as Error);
      return false;
    }
  }

  // 等待网络恢复
  public async waitForNetworkRecovery(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.onNetworkStatusChange((status) => {
        if (status !== 'offline') {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  // 清除重试计数
  public clearRetryAttempts(operationId?: string): void {
    if (operationId) {
      this.retryAttempts.delete(operationId);
    } else {
      this.retryAttempts.clear();
    }
  }
}

// 导出单例实例
export const networkErrorHandler = NetworkErrorHandler.getInstance();

// 便捷函数：带重试的fetch
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  strategy?: Partial<ErrorRecoveryStrategy>
): Promise<Response> {
  const defaultStrategy: ErrorRecoveryStrategy = {
    retryable: true,
    maxRetries: 3,
    backoffStrategy: 'exponential',
    userMessage: '正在重试...',
    logLevel: 'warn',
    ...strategy
  };

  return networkErrorHandler.executeWithRetry(
    () => fetch(url, options),
    `fetch-${url}`,
    defaultStrategy
  );
}

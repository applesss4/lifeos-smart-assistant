/**
 * 网络自适应工具
 * 根据网络类型和质量调整资源加载策略
 */

export type NetworkType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
export type NetworkQuality = 'high' | 'medium' | 'low';

interface NetworkInfo {
  type: NetworkType;
  quality: NetworkQuality;
  effectiveType: string;
  downlink?: number;
  rtt?: number;
  saveData: boolean;
}

/**
 * 获取当前网络信息
 */
export function getNetworkInfo(): NetworkInfo {
  // 检查是否支持Network Information API
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    return {
      type: 'unknown',
      quality: 'high',
      effectiveType: 'unknown',
      saveData: false
    };
  }

  const effectiveType = connection.effectiveType || 'unknown';
  const downlink = connection.downlink;
  const rtt = connection.rtt;
  const saveData = connection.saveData || false;

  // 确定网络类型
  let type: NetworkType = 'unknown';
  if (effectiveType === '4g') type = '4g';
  else if (effectiveType === '3g') type = '3g';
  else if (effectiveType === '2g') type = '2g';
  else if (effectiveType === 'slow-2g') type = 'slow-2g';

  // 确定网络质量
  let quality: NetworkQuality = 'high';
  if (type === 'slow-2g' || type === '2g') {
    quality = 'low';
  } else if (type === '3g') {
    quality = 'medium';
  } else if (type === '4g') {
    quality = 'high';
  }

  // 如果用户启用了数据节省模式，降低质量
  if (saveData) {
    quality = 'low';
  }

  return {
    type,
    quality,
    effectiveType,
    downlink,
    rtt,
    saveData
  };
}

/**
 * 监听网络变化
 */
export function onNetworkChange(callback: (info: NetworkInfo) => void): () => void {
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    return () => {}; // 不支持，返回空清理函数
  }

  const handler = () => {
    callback(getNetworkInfo());
  };

  connection.addEventListener('change', handler);

  return () => {
    connection.removeEventListener('change', handler);
  };
}

/**
 * 根据网络质量调整资源加载策略
 */
export interface ResourceLoadStrategy {
  enableImages: boolean;
  imageQuality: 'high' | 'medium' | 'low';
  enableAnimations: boolean;
  enableVideos: boolean;
  prefetchEnabled: boolean;
  chunkSize: 'large' | 'medium' | 'small';
}

export function getResourceLoadStrategy(networkQuality: NetworkQuality): ResourceLoadStrategy {
  switch (networkQuality) {
    case 'high':
      return {
        enableImages: true,
        imageQuality: 'high',
        enableAnimations: true,
        enableVideos: true,
        prefetchEnabled: true,
        chunkSize: 'large'
      };
    
    case 'medium':
      return {
        enableImages: true,
        imageQuality: 'medium',
        enableAnimations: true,
        enableVideos: false,
        prefetchEnabled: false,
        chunkSize: 'medium'
      };
    
    case 'low':
      return {
        enableImages: true,
        imageQuality: 'low',
        enableAnimations: false,
        enableVideos: false,
        prefetchEnabled: false,
        chunkSize: 'small'
      };
  }
}

/**
 * 检查是否应该加载资源
 */
export function shouldLoadResource(resourceType: 'image' | 'video' | 'animation'): boolean {
  const networkInfo = getNetworkInfo();
  const strategy = getResourceLoadStrategy(networkInfo.quality);

  switch (resourceType) {
    case 'image':
      return strategy.enableImages;
    case 'video':
      return strategy.enableVideos;
    case 'animation':
      return strategy.enableAnimations;
    default:
      return true;
  }
}

/**
 * 获取图片质量参数
 */
export function getImageQualityParams(): { quality: number; format: string } {
  const networkInfo = getNetworkInfo();
  const strategy = getResourceLoadStrategy(networkInfo.quality);

  switch (strategy.imageQuality) {
    case 'high':
      return { quality: 90, format: 'webp' };
    case 'medium':
      return { quality: 70, format: 'webp' };
    case 'low':
      return { quality: 50, format: 'jpeg' };
  }
}

/**
 * 检查是否为弱网环境
 */
export function isSlowNetwork(): boolean {
  const networkInfo = getNetworkInfo();
  return networkInfo.quality === 'low' || networkInfo.saveData;
}

/**
 * 获取推荐的请求超时时间（毫秒）
 */
export function getRecommendedTimeout(): number {
  const networkInfo = getNetworkInfo();
  
  switch (networkInfo.quality) {
    case 'high':
      return 5000; // 5秒
    case 'medium':
      return 10000; // 10秒
    case 'low':
      return 20000; // 20秒
    default:
      return 10000;
  }
}

/**
 * 网络自适应管理器
 */
export class NetworkAdaptiveManager {
  private currentStrategy: ResourceLoadStrategy;
  private listeners: Array<(strategy: ResourceLoadStrategy) => void> = [];
  private cleanupFn?: () => void;

  constructor() {
    const networkInfo = getNetworkInfo();
    this.currentStrategy = getResourceLoadStrategy(networkInfo.quality);
    this.startMonitoring();
  }

  /**
   * 开始监控网络变化
   */
  private startMonitoring(): void {
    this.cleanupFn = onNetworkChange((info) => {
      const newStrategy = getResourceLoadStrategy(info.quality);
      
      // 只在策略发生变化时通知
      if (JSON.stringify(newStrategy) !== JSON.stringify(this.currentStrategy)) {
        this.currentStrategy = newStrategy;
        this.notifyListeners();
      }
    });
  }

  /**
   * 获取当前策略
   */
  getStrategy(): ResourceLoadStrategy {
    return { ...this.currentStrategy };
  }

  /**
   * 订阅策略变化
   */
  subscribe(listener: (strategy: ResourceLoadStrategy) => void): () => void {
    this.listeners.push(listener);
    
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
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentStrategy);
    });
  }

  /**
   * 停止监控
   */
  destroy(): void {
    if (this.cleanupFn) {
      this.cleanupFn();
    }
    this.listeners = [];
  }
}

/**
 * 全局网络自适应管理器实例
 */
export const networkAdapter = new NetworkAdaptiveManager();

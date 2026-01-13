/**
 * 触摸事件优化工具
 * 为移动端提供优化的触摸事件处理
 */

/**
 * 为滚动容器添加passive事件监听器
 * 提升滚动性能，避免阻塞主线程
 */
export function addPassiveScrollListener(
  element: HTMLElement | Window,
  handler: EventListener
): () => void {
  element.addEventListener('scroll', handler, { passive: true });
  
  // 返回清理函数
  return () => {
    element.removeEventListener('scroll', handler);
  };
}

/**
 * 为触摸事件添加passive监听器
 * 优化触摸响应性能
 */
export function addPassiveTouchListener(
  element: HTMLElement,
  eventType: 'touchstart' | 'touchmove' | 'touchend',
  handler: EventListener
): () => void {
  element.addEventListener(eventType, handler, { passive: true });
  
  return () => {
    element.removeEventListener(eventType, handler);
  };
}

/**
 * 批量添加passive事件监听器
 */
export function addPassiveListeners(
  element: HTMLElement,
  events: Array<{
    type: 'scroll' | 'touchstart' | 'touchmove' | 'touchend';
    handler: EventListener;
  }>
): () => void {
  const cleanupFns = events.map(({ type, handler }) => {
    element.addEventListener(type, handler, { passive: true });
    return () => element.removeEventListener(type, handler);
  });
  
  // 返回统一的清理函数
  return () => {
    cleanupFns.forEach(cleanup => cleanup());
  };
}

/**
 * 应用touch-action CSS优化
 * 通过CSS属性优化触摸行为
 */
export function applyTouchActionOptimization(element: HTMLElement, action: string = 'manipulation'): void {
  element.style.touchAction = action;
}

/**
 * 为可滚动容器应用优化
 */
export function optimizeScrollContainer(element: HTMLElement): void {
  // 设置touch-action
  element.style.touchAction = 'pan-y';
  
  // 启用硬件加速
  element.style.willChange = 'scroll-position';
  
  // 优化滚动性能
  element.style.webkitOverflowScrolling = 'touch';
}

/**
 * 移除不必要的事件监听器
 * 清理已注册的事件监听器，避免内存泄漏
 */
export class EventListenerManager {
  private listeners: Map<string, Array<{ element: EventTarget; type: string; handler: EventListener; options?: AddEventListenerOptions }>> = new Map();
  
  /**
   * 添加事件监听器并跟踪
   */
  add(
    key: string,
    element: EventTarget,
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(type, handler, options);
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push({ element, type, handler, options });
  }
  
  /**
   * 移除指定key的所有监听器
   */
  remove(key: string): void {
    const keyListeners = this.listeners.get(key);
    if (!keyListeners) return;
    
    keyListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    
    this.listeners.delete(key);
  }
  
  /**
   * 移除所有监听器
   */
  removeAll(): void {
    this.listeners.forEach((_, key) => {
      this.remove(key);
    });
  }
  
  /**
   * 获取当前监听器数量
   */
  getListenerCount(): number {
    let count = 0;
    this.listeners.forEach(listeners => {
      count += listeners.length;
    });
    return count;
  }
}

/**
 * 全局事件监听器管理器实例
 */
export const globalEventManager = new EventListenerManager();

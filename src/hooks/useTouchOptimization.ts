import { useEffect, useRef, RefObject } from 'react';
import { addPassiveScrollListener, addPassiveTouchListener, optimizeScrollContainer } from '../utils/touchOptimizer';

/**
 * Hook for optimizing touch events on mobile devices
 * Automatically applies passive listeners and touch-action CSS
 */
export function useTouchOptimization<T extends HTMLElement>(
  options: {
    enableScroll?: boolean;
    enableTouch?: boolean;
    touchAction?: string;
  } = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const {
    enableScroll = true,
    enableTouch = true,
    touchAction = 'manipulation'
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 应用touch-action优化
    element.style.touchAction = touchAction;

    const cleanupFns: Array<() => void> = [];

    // 如果启用滚动优化
    if (enableScroll) {
      optimizeScrollContainer(element);
      
      // 添加passive滚动监听器（如果需要）
      // 这里只是示例，实际使用时可以传入handler
      const scrollCleanup = addPassiveScrollListener(element, () => {
        // 滚动处理逻辑
      });
      cleanupFns.push(scrollCleanup);
    }

    // 如果启用触摸优化
    if (enableTouch) {
      // 添加passive触摸监听器
      const touchStartCleanup = addPassiveTouchListener(element, 'touchstart', () => {
        // 触摸开始处理逻辑
      });
      cleanupFns.push(touchStartCleanup);
    }

    // 清理函数
    return () => {
      cleanupFns.forEach(cleanup => cleanup());
    };
  }, [enableScroll, enableTouch, touchAction]);

  return ref;
}

/**
 * Hook for passive scroll listener
 * 为滚动事件添加passive监听器
 */
export function usePassiveScroll(
  handler: EventListener,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const cleanup = addPassiveScrollListener(window, handler);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for optimizing scrollable containers
 * 优化可滚动容器的性能
 */
export function useScrollOptimization<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    optimizeScrollContainer(element);
  }, []);

  return ref;
}

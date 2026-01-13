import { useState, useEffect } from 'react';
import {
  getNetworkInfo,
  getResourceLoadStrategy,
  networkAdapter,
  isSlowNetwork,
  shouldLoadResource,
  NetworkQuality,
  ResourceLoadStrategy
} from '../utils/networkAdapter';

/**
 * Hook for network-adaptive resource loading
 * 根据网络状况自动调整资源加载策略
 */
export function useNetworkAdaptive() {
  const [strategy, setStrategy] = useState<ResourceLoadStrategy>(() => {
    const networkInfo = getNetworkInfo();
    return getResourceLoadStrategy(networkInfo.quality);
  });

  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(() => {
    return getNetworkInfo().quality;
  });

  useEffect(() => {
    // 订阅网络策略变化
    const unsubscribe = networkAdapter.subscribe((newStrategy) => {
      setStrategy(newStrategy);
      const networkInfo = getNetworkInfo();
      setNetworkQuality(networkInfo.quality);
    });

    return unsubscribe;
  }, []);

  return {
    strategy,
    networkQuality,
    isSlowNetwork: networkQuality === 'low',
    shouldLoadImages: strategy.enableImages,
    shouldLoadVideos: strategy.enableVideos,
    shouldLoadAnimations: strategy.enableAnimations,
    imageQuality: strategy.imageQuality,
    prefetchEnabled: strategy.prefetchEnabled
  };
}

/**
 * Hook to check if resource should be loaded based on network
 */
export function useShouldLoadResource(resourceType: 'image' | 'video' | 'animation'): boolean {
  const [shouldLoad, setShouldLoad] = useState(() => shouldLoadResource(resourceType));

  useEffect(() => {
    const unsubscribe = networkAdapter.subscribe(() => {
      setShouldLoad(shouldLoadResource(resourceType));
    });

    return unsubscribe;
  }, [resourceType]);

  return shouldLoad;
}

/**
 * Hook to detect slow network
 */
export function useIsSlowNetwork(): boolean {
  const [isSlow, setIsSlow] = useState(() => isSlowNetwork());

  useEffect(() => {
    const unsubscribe = networkAdapter.subscribe(() => {
      setIsSlow(isSlowNetwork());
    });

    return unsubscribe;
  }, []);

  return isSlow;
}

/**
 * Hook for network quality
 */
export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(() => {
    return getNetworkInfo().quality;
  });

  useEffect(() => {
    const unsubscribe = networkAdapter.subscribe(() => {
      const networkInfo = getNetworkInfo();
      setQuality(networkInfo.quality);
    });

    return unsubscribe;
  }, []);

  return quality;
}

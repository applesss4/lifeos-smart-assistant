/**
 * React Hook for Service Worker integration
 * Provides easy access to Service Worker functionality in components
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager, ServiceWorkerManager } from '../utils/serviceWorkerManager';

export interface ServiceWorkerState {
  isSupported: boolean;
  isActive: boolean;
  isUpdateAvailable: boolean;
  cacheSize: number;
  registration: ServiceWorkerRegistration | null;
}

export interface ServiceWorkerActions {
  checkForUpdates: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  clearCache: () => Promise<void>;
  invalidateCache: (url: string) => Promise<void>;
  getCacheSize: () => Promise<number>;
}

export function useServiceWorker(): [ServiceWorkerState, ServiceWorkerActions] {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: ServiceWorkerManager.isSupported(),
    isActive: false,
    isUpdateAvailable: false,
    cacheSize: 0,
    registration: null,
  });

  // Initialize Service Worker
  useEffect(() => {
    if (!state.isSupported) return;

    // Register Service Worker
    serviceWorkerManager.register({
      onSuccess: (registration) => {
        setState(prev => ({
          ...prev,
          isActive: true,
          registration,
        }));
      },
      onUpdate: (registration) => {
        setState(prev => ({
          ...prev,
          isUpdateAvailable: true,
          registration,
        }));
      },
      onError: (error) => {
        console.error('[useServiceWorker] Registration error:', error);
      },
    });

    // Update cache size periodically
    const updateCacheSize = async () => {
      try {
        const size = await serviceWorkerManager.getCacheSize();
        setState(prev => ({ ...prev, cacheSize: size }));
      } catch (error) {
        console.error('[useServiceWorker] Failed to get cache size:', error);
      }
    };

    updateCacheSize();
    const interval = setInterval(updateCacheSize, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [state.isSupported]);

  // Actions
  const checkForUpdates = useCallback(async () => {
    try {
      await serviceWorkerManager.checkForUpdates();
    } catch (error) {
      console.error('[useServiceWorker] Update check failed:', error);
    }
  }, []);

  const skipWaiting = useCallback(async () => {
    try {
      await serviceWorkerManager.skipWaiting();
      setState(prev => ({ ...prev, isUpdateAvailable: false }));
    } catch (error) {
      console.error('[useServiceWorker] Skip waiting failed:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await serviceWorkerManager.clearCache();
      setState(prev => ({ ...prev, cacheSize: 0 }));
    } catch (error) {
      console.error('[useServiceWorker] Clear cache failed:', error);
      throw error;
    }
  }, []);

  const invalidateCache = useCallback(async (url: string) => {
    try {
      await serviceWorkerManager.invalidateCache(url);
    } catch (error) {
      console.error('[useServiceWorker] Invalidate cache failed:', error);
      throw error;
    }
  }, []);

  const getCacheSize = useCallback(async () => {
    try {
      const size = await serviceWorkerManager.getCacheSize();
      setState(prev => ({ ...prev, cacheSize: size }));
      return size;
    } catch (error) {
      console.error('[useServiceWorker] Get cache size failed:', error);
      return 0;
    }
  }, []);

  const actions: ServiceWorkerActions = {
    checkForUpdates,
    skipWaiting,
    clearCache,
    invalidateCache,
    getCacheSize,
  };

  return [state, actions];
}

/**
 * Hook for displaying update notification
 */
export function useServiceWorkerUpdate(onUpdate?: () => void) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!ServiceWorkerManager.isSupported()) return;

    serviceWorkerManager.register({
      onUpdate: () => {
        setIsUpdateAvailable(true);
        onUpdate?.();
      },
    });
  }, [onUpdate]);

  const applyUpdate = useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
    setIsUpdateAvailable(false);
  }, []);

  return { isUpdateAvailable, applyUpdate };
}

/**
 * Hook for offline detection with Service Worker support
 */
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we have cached data
    const checkCache = async () => {
      try {
        const size = await serviceWorkerManager.getCacheSize();
        setHasCachedData(size > 0);
      } catch (error) {
        console.error('[useOfflineSupport] Failed to check cache:', error);
      }
    };

    checkCache();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    hasCachedData,
    canWorkOffline: !isOnline && hasCachedData,
  };
}

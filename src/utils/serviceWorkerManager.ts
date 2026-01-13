/**
 * Service Worker Manager
 * Handles registration, updates, and communication with the Service Worker
 */

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  /**
   * Register the Service Worker
   */
  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    this.config = config;

    // Check if Service Workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Manager] Service Workers are not supported');
      return;
    }

    // Only register in production or when explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_SW_DEV) {
      console.log('[SW Manager] Service Worker disabled in development');
      return;
    }

    try {
      // Register the Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Manager] Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate();
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        this.checkForUpdates();
      }, 60 * 60 * 1000);

      // Listen for messages from Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event);
      });

      // Notify success
      if (this.config.onSuccess) {
        this.config.onSuccess(this.registration);
      }
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  /**
   * Handle Service Worker updates
   */
  private handleUpdate(): void {
    if (!this.registration) return;

    const installingWorker = this.registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New Service Worker available
          console.log('[SW Manager] New Service Worker available');
          
          if (this.config.onUpdate) {
            this.config.onUpdate(this.registration!);
          }
        } else {
          // Service Worker installed for the first time
          console.log('[SW Manager] Service Worker installed for the first time');
        }
      }
    });
  }

  /**
   * Check for Service Worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SW Manager] Checked for updates');
    } catch (error) {
      console.error('[SW Manager] Update check failed:', error);
    }
  }

  /**
   * Skip waiting and activate new Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    // Send message to Service Worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Unregister the Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      console.log('[SW Manager] Service Worker unregistered:', success);
      this.registration = null;
      return success;
    } catch (error) {
      console.error('[SW Manager] Unregistration failed:', error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW Manager] No active Service Worker');
      return;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('[SW Manager] Cache cleared successfully');
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Clear specific cache by name or pattern
   */
  async clearCacheByPattern(pattern: string): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[SW Manager] Cache API not supported');
      return;
    }

    const cacheNames = await caches.keys();
    const matchingCaches = cacheNames.filter(name => name.includes(pattern));

    await Promise.all(
      matchingCaches.map(cacheName => {
        console.log('[SW Manager] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );

    console.log(`[SW Manager] Cleared ${matchingCaches.length} caches matching pattern: ${pattern}`);
  }

  /**
   * Invalidate cache for specific URL
   */
  async invalidateCache(url: string): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[SW Manager] Cache API not supported');
      return;
    }

    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const deleted = await cache.delete(url);
      
      if (deleted) {
        console.log('[SW Manager] Invalidated cache for:', url);
      }
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW Manager] No active Service Worker');
      return 0;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.size !== undefined) {
          resolve(event.data.size);
        } else {
          reject(new Error('Failed to get cache size'));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Handle messages from Service Worker
   */
  private handleMessage(event: MessageEvent): void {
    console.log('[SW Manager] Message from Service Worker:', event.data);
    
    // Handle different message types
    if (event.data.type === 'CACHE_UPDATED') {
      console.log('[SW Manager] Cache updated:', event.data.url);
    }
  }

  /**
   * Get registration status
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if Service Worker is active
   */
  isActive(): boolean {
    return !!this.registration?.active;
  }

  /**
   * Check if Service Worker is supported
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export class for type checking
export { ServiceWorkerManager };

// Export default for convenience
export default serviceWorkerManager;

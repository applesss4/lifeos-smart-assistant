// Service Worker for LifeOS
// Implements caching strategies for offline support and performance optimization

const CACHE_VERSION = 'v1';
const CACHE_NAME = `lifeos-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lifeos-runtime-${CACHE_VERSION}`;
const API_CACHE = `lifeos-api-${CACHE_VERSION}`;

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Static assets: Cache first, fallback to network
  static: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  
  // API calls: Network first, fallback to cache
  api: /\/api\//,
  
  // Supabase: Network first with cache fallback
  supabase: /supabase\.co/,
};

// Cache TTL (Time To Live) configurations
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000,  // 7 days for static assets
  api: 5 * 60 * 1000,                 // 5 minutes for API responses
  default: 24 * 60 * 60 * 1000,       // 1 day default
};

// Maximum number of items in runtime cache
const MAX_RUNTIME_CACHE_SIZE = 50;
const MAX_API_CACHE_SIZE = 30;

/**
 * Install event - precache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches and implement cache versioning
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old cache versions
      cleanupOldCaches(),
      // Clean up expired cache entries
      cleanupExpiredCaches(),
    ])
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Clean up old cache versions
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  return Promise.all(
    cacheNames
      .filter((cacheName) => {
        // Delete caches that don't match current version
        return cacheName.startsWith('lifeos-') && !validCaches.includes(cacheName);
      })
      .map((cacheName) => {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

/**
 * Clean up expired cache entries
 */
async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith('lifeos-')) continue;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && isCacheExpired(response, getCacheTTL(request.url))) {
        console.log('[SW] Removing expired cache:', request.url);
        await cache.delete(request);
      }
    }
  }
}

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine cache strategy based on URL
  if (CACHE_STRATEGIES.static.test(url.pathname)) {
    // Static assets: Cache first with stale-while-revalidate
    event.respondWith(cacheFirstWithRevalidate(request));
  } else if (CACHE_STRATEGIES.api.test(url.pathname) || CACHE_STRATEGIES.supabase.test(url.hostname)) {
    // API calls: Stale-while-revalidate for better UX
    event.respondWith(staleWhileRevalidate(request, API_CACHE, CACHE_TTL.api));
  } else {
    // Default: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, CACHE_TTL.default));
  }
});

/**
 * Cache-first strategy with background revalidation
 * Return cached response immediately, update cache in background if stale
 */
async function cacheFirstWithRevalidate(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      const ttl = getCacheTTL(request.url);
      
      // Check if cache is still fresh
      if (!isCacheExpired(cachedResponse, ttl)) {
        console.log('[SW] Cache hit (fresh):', request.url);
        return cachedResponse;
      }
      
      // Cache is stale, revalidate in background
      console.log('[SW] Cache hit (stale), revalidating:', request.url);
      revalidateInBackground(request, CACHE_NAME);
      return cachedResponse;
    }
    
    // Cache miss, fetch from network
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache the new response
    if (networkResponse.ok) {
      await cacheResponse(CACHE_NAME, request, networkResponse.clone(), CACHE_TTL.static);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    
    // Try to return cached response even if expired
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning stale cache due to network error');
      return cachedResponse;
    }
    
    // Return offline page or error
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-while-revalidate strategy with TTL support
 * Return cached response immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE, ttl = CACHE_TTL.default) {
  const cachedResponse = await caches.match(request);
  
  // Always fetch from network in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        // Update cache in background
        cacheResponse(cacheName, request, networkResponse.clone(), ttl).catch((error) => {
          console.error('[SW] Background cache update failed:', error);
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[SW] Network fetch failed:', error);
      return null;
    });
  
  // Return cached response immediately if available and not expired
  if (cachedResponse) {
    if (!isCacheExpired(cachedResponse, ttl)) {
      console.log('[SW] Returning fresh cache, revalidating in background');
      return cachedResponse;
    } else {
      console.log('[SW] Returning stale cache, revalidating in background');
      // Return stale cache but prefer network if it completes quickly
      return Promise.race([
        cachedResponse,
        new Promise(resolve => setTimeout(() => resolve(cachedResponse), 100))
      ]);
    }
  }
  
  // No cache, wait for network
  console.log('[SW] No cache, waiting for network');
  const networkResponse = await networkPromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  // Both cache and network failed
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

/**
 * Revalidate cache in background
 */
async function revalidateInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const ttl = getCacheTTL(request.url);
      await cacheResponse(cacheName, request, networkResponse, ttl);
      console.log('[SW] Background revalidation successful:', request.url);
    }
  } catch (error) {
    console.error('[SW] Background revalidation failed:', error);
  }
}

/**
 * Cache a response with metadata and TTL
 */
async function cacheResponse(cacheName, request, response, ttl = CACHE_TTL.default) {
  const cache = await caches.open(cacheName);
  
  // Add cache metadata to response headers
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', new Date().toISOString());
  headers.set('sw-cache-ttl', ttl.toString());
  
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
  
  await cache.put(request, modifiedResponse);
  
  // Limit cache size based on cache type
  const maxSize = cacheName === API_CACHE ? MAX_API_CACHE_SIZE : MAX_RUNTIME_CACHE_SIZE;
  await limitCacheSize(cacheName, maxSize);
}

/**
 * Check if cache is expired based on TTL
 */
function isCacheExpired(response, ttl) {
  const cacheTime = response.headers.get('sw-cache-time');
  if (!cacheTime) return true;
  
  const cacheDate = new Date(cacheTime).getTime();
  const now = Date.now();
  
  return (now - cacheDate) > ttl;
}

/**
 * Get appropriate TTL for a URL
 */
function getCacheTTL(url) {
  if (CACHE_STRATEGIES.static.test(url)) {
    return CACHE_TTL.static;
  } else if (CACHE_STRATEGIES.api.test(url) || CACHE_STRATEGIES.supabase.test(url)) {
    return CACHE_TTL.api;
  }
  return CACHE_TTL.default;
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    console.log(`[SW] Removed ${keysToDelete.length} old cache entries`);
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    const { url } = event.data;
    event.waitUntil(
      invalidateCacheForUrl(url).then(() => {
        console.log('[SW] Cache invalidated for:', url);
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      getCacheInfo().then((info) => {
        event.ports[0].postMessage({ info });
      })
    );
  }
});

/**
 * Invalidate cache for a specific URL
 */
async function invalidateCacheForUrl(url) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    await cache.delete(url);
  }
}

/**
 * Get cache information
 */
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    info[cacheName] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return info;
}

/**
 * Calculate total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service Worker script loaded');

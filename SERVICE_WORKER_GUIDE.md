# Service Worker Implementation Guide

## Overview

This document describes the Service Worker implementation for LifeOS, which provides offline support, intelligent caching, and improved performance through strategic resource caching.

## Features

### 1. Caching Strategies

The Service Worker implements multiple caching strategies optimized for different resource types:

#### Cache-First with Revalidation
- **Used for**: Static assets (JS, CSS, fonts, images)
- **Behavior**: Returns cached response immediately if fresh, revalidates in background if stale
- **TTL**: 7 days
- **Benefits**: Instant loading for static resources, automatic updates in background

#### Stale-While-Revalidate
- **Used for**: API calls, Supabase requests
- **Behavior**: Returns cached response immediately, fetches fresh data in background
- **TTL**: 5 minutes for API, 1 day for other resources
- **Benefits**: Instant response with eventual consistency

### 2. Cache Versioning

The Service Worker uses versioned caches to ensure clean updates:

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `lifeos-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lifeos-runtime-${CACHE_VERSION}`;
const API_CACHE = `lifeos-api-${CACHE_VERSION}`;
```

When the Service Worker updates, old cache versions are automatically cleaned up.

### 3. Cache TTL (Time To Live)

Different resources have different cache lifetimes:

- **Static assets**: 7 days
- **API responses**: 5 minutes
- **Default**: 1 day

Cache entries are automatically expired and cleaned up based on their TTL.

### 4. Cache Size Management

The Service Worker limits cache sizes to prevent excessive storage usage:

- **Runtime cache**: Maximum 50 entries
- **API cache**: Maximum 30 entries

Oldest entries are removed when limits are exceeded (FIFO strategy).

## Usage

### Basic Setup

The Service Worker is automatically registered in production mode:

```typescript
// index.tsx
import { serviceWorkerManager } from './src/utils/serviceWorkerManager';

if (import.meta.env.PROD) {
  serviceWorkerManager.register({
    onSuccess: (registration) => {
      console.log('Service Worker registered successfully');
    },
    onUpdate: (registration) => {
      // Show update notification to user
      if (confirm('A new version is available. Reload to update?')) {
        serviceWorkerManager.skipWaiting();
      }
    },
    onError: (error) => {
      console.error('Service Worker registration failed:', error);
    },
  });
}
```

### Using the React Hook

```typescript
import { useServiceWorker } from './src/hooks/useServiceWorker';

function MyComponent() {
  const [state, actions] = useServiceWorker();

  return (
    <div>
      <p>Service Worker Active: {state.isActive ? 'Yes' : 'No'}</p>
      <p>Cache Size: {(state.cacheSize / 1024 / 1024).toFixed(2)} MB</p>
      
      {state.isUpdateAvailable && (
        <button onClick={actions.skipWaiting}>
          Update Available - Click to Reload
        </button>
      )}
      
      <button onClick={actions.clearCache}>
        Clear Cache
      </button>
    </div>
  );
}
```

### Update Notification Hook

```typescript
import { useServiceWorkerUpdate } from './src/hooks/useServiceWorker';

function App() {
  const { isUpdateAvailable, applyUpdate } = useServiceWorkerUpdate(() => {
    console.log('New version available!');
  });

  return (
    <>
      {isUpdateAvailable && (
        <div className="update-banner">
          <p>A new version is available!</p>
          <button onClick={applyUpdate}>Update Now</button>
        </div>
      )}
      {/* Rest of app */}
    </>
  );
}
```

### Offline Support Hook

```typescript
import { useOfflineSupport } from './src/hooks/useServiceWorker';

function OfflineIndicator() {
  const { isOffline, canWorkOffline } = useOfflineSupport();

  if (!isOffline) return null;

  return (
    <div className="offline-banner">
      {canWorkOffline ? (
        <p>You're offline, but cached data is available</p>
      ) : (
        <p>You're offline and no cached data is available</p>
      )}
    </div>
  );
}
```

## API Reference

### ServiceWorkerManager

#### Methods

- `register(config)`: Register the Service Worker
- `checkForUpdates()`: Manually check for Service Worker updates
- `skipWaiting()`: Activate new Service Worker and reload page
- `unregister()`: Unregister the Service Worker
- `clearCache()`: Clear all caches
- `clearCacheByPattern(pattern)`: Clear caches matching a pattern
- `invalidateCache(url)`: Invalidate cache for a specific URL
- `getCacheSize()`: Get total cache size in bytes
- `getRegistration()`: Get the Service Worker registration
- `isActive()`: Check if Service Worker is active

### Cache Management

#### Clear All Caches

```typescript
await serviceWorkerManager.clearCache();
```

#### Clear Specific Cache

```typescript
await serviceWorkerManager.clearCacheByPattern('api');
```

#### Invalidate URL

```typescript
await serviceWorkerManager.invalidateCache('/api/tasks');
```

#### Get Cache Size

```typescript
const size = await serviceWorkerManager.getCacheSize();
console.log(`Cache size: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

## Development

### Testing in Development

By default, the Service Worker is disabled in development mode. To enable it:

```bash
VITE_SW_DEV=true npm run dev
```

### Debugging

1. Open Chrome DevTools
2. Go to Application tab
3. Click "Service Workers" in the sidebar
4. View registered Service Workers and their status

### Cache Inspection

1. Open Chrome DevTools
2. Go to Application tab
3. Click "Cache Storage" in the sidebar
4. Inspect cached resources

## Build Configuration

The Service Worker is automatically copied to the dist folder during production builds:

```typescript
// vite.config.ts
{
  name: 'copy-sw',
  closeBundle() {
    if (isProduction) {
      copyFileSync('public/sw.js', 'dist/sw.js');
    }
  }
}
```

## Best Practices

### 1. Cache Invalidation

When data changes on the server, invalidate the cache:

```typescript
// After updating a task
await fetch('/api/tasks', { method: 'PUT', body: JSON.stringify(task) });
await serviceWorkerManager.invalidateCache('/api/tasks');
```

### 2. Update Notifications

Always notify users when updates are available:

```typescript
serviceWorkerManager.register({
  onUpdate: (registration) => {
    showNotification('New version available!', {
      action: () => serviceWorkerManager.skipWaiting()
    });
  }
});
```

### 3. Offline Handling

Provide clear feedback when offline:

```typescript
const { isOffline, canWorkOffline } = useOfflineSupport();

if (isOffline && !canWorkOffline) {
  return <OfflineMessage />;
}
```

### 4. Cache Size Monitoring

Monitor cache size to prevent excessive storage usage:

```typescript
const size = await serviceWorkerManager.getCacheSize();
if (size > 50 * 1024 * 1024) { // 50MB
  await serviceWorkerManager.clearCache();
}
```

## Troubleshooting

### Service Worker Not Registering

1. Check that you're in production mode or have `VITE_SW_DEV=true`
2. Verify that `public/sw.js` exists
3. Check browser console for errors
4. Ensure HTTPS is enabled (required for Service Workers)

### Cache Not Updating

1. Check cache TTL settings
2. Manually clear cache: `serviceWorkerManager.clearCache()`
3. Unregister and re-register Service Worker
4. Check Network tab in DevTools for cache hits/misses

### Old Version Persisting

1. Unregister the Service Worker
2. Clear all caches
3. Hard reload the page (Ctrl+Shift+R)
4. Re-register the Service Worker

## Performance Impact

### Benefits

- **Faster load times**: Cached resources load instantly
- **Offline support**: App works without network connection
- **Reduced bandwidth**: Fewer network requests
- **Better UX**: Instant responses with stale-while-revalidate

### Considerations

- **Storage usage**: Caches consume device storage (limited to 50-100 entries)
- **Update delay**: Users may see stale content briefly
- **Complexity**: Adds complexity to debugging and testing

## Requirements Validation

This implementation satisfies the following requirements:

- **需求 10.1**: Browser caching for downloaded resources ✓
- **需求 10.2**: In-memory caching with TTL ✓
- **需求 10.3**: Offline support with cached data ✓
- **需求 10.4**: Background cache refresh (stale-while-revalidate) ✓
- **需求 10.5**: Cache invalidation strategy ✓

## Future Enhancements

1. **Background Sync**: Queue failed requests and retry when online
2. **Push Notifications**: Notify users of updates
3. **Precaching**: Intelligently precache likely-needed resources
4. **Analytics**: Track cache hit rates and performance metrics
5. **Selective Caching**: Allow users to control what gets cached

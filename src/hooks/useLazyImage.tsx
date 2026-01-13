import { useEffect, useRef, useState } from 'react';

/**
 * Hook for lazy loading images using Intersection Observer
 * 
 * @param src - The image source URL
 * @param options - Intersection Observer options
 * @returns Object containing ref to attach to img element and loaded state
 * 
 * @example
 * ```tsx
 * const { ref, loaded } = useLazyImage('/path/to/image.jpg');
 * 
 * return (
 *   <img
 *     ref={ref}
 *     src={loaded ? '/path/to/image.jpg' : '/placeholder.jpg'}
 *     alt="Description"
 *     loading="lazy"
 *   />
 * );
 * ```
 */
export function useLazyImage(
  src: string,
  options: IntersectionObserverInit = {}
): {
  ref: React.RefObject<HTMLImageElement>;
  loaded: boolean;
  error: boolean;
} {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If browser doesn't support IntersectionObserver, load immediately
    if (!('IntersectionObserver' in window)) {
      setLoaded(true);
      return;
    }

    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Default options for intersection observer
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px', // Start loading 50px before image enters viewport
      threshold: 0.01,
      ...options,
    };

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Image is in viewport, start loading
          const img = entry.target as HTMLImageElement;
          
          // Set up load and error handlers
          const handleLoad = () => {
            setLoaded(true);
            setError(false);
          };

          const handleError = () => {
            setError(true);
            setLoaded(false);
          };

          img.addEventListener('load', handleLoad);
          img.addEventListener('error', handleError);

          // Trigger image load by setting src
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }

          // Stop observing once loaded
          observer.unobserve(img);

          // Cleanup listeners
          return () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
          };
        }
      });
    }, observerOptions);

    // Start observing
    observer.observe(imgElement);

    // Cleanup
    return () => {
      if (imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [src, options]);

  return { ref: imgRef, loaded, error };
}

/**
 * Component wrapper for lazy loaded images
 * Provides a complete solution with placeholder and error handling
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   placeholder="/placeholder.jpg"
 *   className="w-full h-auto"
 * />
 * ```
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder = '',
  className = '',
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const { ref, loaded, error } = useLazyImage(src);

  useEffect(() => {
    if (loaded && onLoad) {
      onLoad();
    }
  }, [loaded, onLoad]);

  useEffect(() => {
    if (error && onError) {
      onError();
    }
  }, [error, onError]);

  return (
    <img
      ref={ref}
      data-src={src}
      src={loaded ? src : placeholder}
      alt={alt}
      loading="lazy"
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      {...props}
    />
  );
}

/**
 * Font Loading Optimization Utilities
 * 
 * Provides utilities for optimizing font loading performance:
 * - Preload critical fonts
 * - Use font-display: swap strategy
 * - Subset fonts to reduce file size
 */

/**
 * Font configuration interface
 */
interface FontConfig {
  family: string;
  weights?: number[];
  subsets?: string[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

/**
 * Preload critical fonts to improve initial render performance
 * This should be called early in the application lifecycle
 * 
 * @param fonts - Array of font configurations to preload
 * 
 * @example
 * ```ts
 * preloadFonts([
 *   { family: 'Noto Sans SC', weights: [400, 500, 700] },
 *   { family: 'Inter', weights: [400, 600] }
 * ]);
 * ```
 */
export function preloadFonts(fonts: FontConfig[]): void {
  if (typeof document === 'undefined') return;

  fonts.forEach((font) => {
    const weights = font.weights || [400];
    const display = font.display || 'swap';

    weights.forEach((weight) => {
      // Create a link element for preloading
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      
      // Note: This is a simplified approach. In production, you'd want to
      // preload the actual font files from your CDN or local assets
      link.href = `https://fonts.gstatic.com/s/${font.family.toLowerCase().replace(/\s+/g, '')}/v1/${font.family.toLowerCase().replace(/\s+/g, '')}-${weight}.woff2`;
      
      document.head.appendChild(link);
    });
  });
}

/**
 * Check if fonts are loaded using the Font Loading API
 * 
 * @param fontFamily - Font family name to check
 * @param weight - Font weight to check (default: 400)
 * @returns Promise that resolves when font is loaded
 * 
 * @example
 * ```ts
 * await waitForFont('Noto Sans SC', 400);
 * console.log('Font loaded!');
 * ```
 */
export async function waitForFont(
  fontFamily: string,
  weight: number = 400
): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }

  try {
    await document.fonts.load(`${weight} 1em "${fontFamily}"`);
  } catch (error) {
    console.warn(`Failed to load font: ${fontFamily}`, error);
  }
}

/**
 * Optimize font loading by using font-display: swap
 * This prevents invisible text during font loading
 * 
 * @param fontFamilies - Array of font family names
 * 
 * @example
 * ```ts
 * optimizeFontDisplay(['Noto Sans SC', 'Inter', 'Material Symbols Outlined']);
 * ```
 */
export function optimizeFontDisplay(fontFamilies: string[]): void {
  if (typeof document === 'undefined') return;

  // Create a style element with font-display rules
  const style = document.createElement('style');
  
  const fontFaceRules = fontFamilies
    .map(
      (family) => `
    @font-face {
      font-family: '${family}';
      font-display: swap;
    }
  `
    )
    .join('\n');

  style.textContent = fontFaceRules;
  document.head.appendChild(style);
}

/**
 * Get font loading status for all fonts
 * Useful for debugging and monitoring
 * 
 * @returns Object with font loading statistics
 */
export function getFontLoadingStatus(): {
  loaded: number;
  loading: number;
  failed: number;
  total: number;
} {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return { loaded: 0, loading: 0, failed: 0, total: 0 };
  }

  const fonts = Array.from(document.fonts);
  
  return {
    loaded: fonts.filter((f) => f.status === 'loaded').length,
    loading: fonts.filter((f) => f.status === 'loading').length,
    failed: fonts.filter((f) => f.status === 'error').length,
    total: fonts.length,
  };
}

/**
 * Create optimized Google Fonts URL with subsets and display strategy
 * 
 * @param fonts - Array of font configurations
 * @returns Optimized Google Fonts URL
 * 
 * @example
 * ```ts
 * const url = createOptimizedFontUrl([
 *   { family: 'Noto Sans SC', weights: [400, 500, 700], subsets: ['chinese-simplified'] },
 *   { family: 'Inter', weights: [400, 600] }
 * ]);
 * // Returns: https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Inter:wght@400;600&display=swap&subset=chinese-simplified
 * ```
 */
export function createOptimizedFontUrl(fonts: FontConfig[]): string {
  const baseUrl = 'https://fonts.googleapis.com/css2';
  
  const fontParams = fonts.map((font) => {
    const family = font.family.replace(/\s+/g, '+');
    const weights = font.weights || [400];
    const weightsStr = weights.join(';');
    
    return `family=${family}:wght@${weightsStr}`;
  });

  // Collect all unique subsets
  const allSubsets = new Set<string>();
  fonts.forEach((font) => {
    if (font.subsets) {
      font.subsets.forEach((subset) => allSubsets.add(subset));
    }
  });

  const display = fonts[0]?.display || 'swap';
  
  let url = `${baseUrl}?${fontParams.join('&')}&display=${display}`;
  
  if (allSubsets.size > 0) {
    url += `&subset=${Array.from(allSubsets).join(',')}`;
  }

  return url;
}

/**
 * Initialize font loading optimizations
 * Call this early in your application
 * 
 * @example
 * ```ts
 * // In your main.tsx or App.tsx
 * initFontOptimizations();
 * ```
 */
export function initFontOptimizations(): void {
  // Optimize font display for critical fonts
  optimizeFontDisplay([
    'Noto Sans SC',
    'Inter',
    'Material Symbols Outlined',
  ]);

  // Log font loading status in development
  if (import.meta.env.DEV) {
    document.fonts.ready.then(() => {
      const status = getFontLoadingStatus();
      console.log('Font loading complete:', status);
    });
  }
}

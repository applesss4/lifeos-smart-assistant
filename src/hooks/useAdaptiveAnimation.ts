/**
 * Adaptive Animation Hook
 * 
 * Detects device performance and adjusts animation complexity accordingly.
 * This ensures smooth animations on low-end devices by reducing complexity.
 * 
 * Requirements: 8.2
 */

import { useState, useEffect } from 'react';

/**
 * Animation complexity levels
 */
export type AnimationComplexity = 'full' | 'reduced' | 'minimal' | 'none';

/**
 * Device performance tier
 */
export type PerformanceTier = 'high' | 'medium' | 'low';

/**
 * Animation configuration based on complexity
 */
export interface AnimationConfig {
  complexity: AnimationComplexity;
  duration: number;
  useGPU: boolean;
  enableTransitions: boolean;
  enableAnimations: boolean;
}

/**
 * Detect device performance tier based on available metrics
 */
function detectPerformanceTier(): PerformanceTier {
  // Check if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory !== undefined) {
    if (deviceMemory >= 8) return 'high';
    if (deviceMemory >= 4) return 'medium';
    return 'low';
  }

  // Check hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency !== undefined) {
    if (hardwareConcurrency >= 8) return 'high';
    if (hardwareConcurrency >= 4) return 'medium';
    return 'low';
  }

  // Check connection type (if available)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') return 'high';
    if (effectiveType === '3g') return 'medium';
    return 'low';
  }

  // Default to medium if we can't determine
  return 'medium';
}

/**
 * Get animation configuration based on performance tier
 */
function getAnimationConfig(tier: PerformanceTier): AnimationConfig {
  switch (tier) {
    case 'high':
      return {
        complexity: 'full',
        duration: 300,
        useGPU: true,
        enableTransitions: true,
        enableAnimations: true,
      };
    
    case 'medium':
      return {
        complexity: 'reduced',
        duration: 200,
        useGPU: true,
        enableTransitions: true,
        enableAnimations: true,
      };
    
    case 'low':
      return {
        complexity: 'minimal',
        duration: 100,
        useGPU: false,
        enableTransitions: false,
        enableAnimations: false,
      };
    
    default:
      return {
        complexity: 'reduced',
        duration: 200,
        useGPU: true,
        enableTransitions: true,
        enableAnimations: true,
      };
  }
}

/**
 * Monitor animation performance using requestAnimationFrame
 */
function monitorAnimationPerformance(callback: (fps: number) => void): () => void {
  let frameCount = 0;
  let lastTime = performance.now();
  let animationFrameId: number;

  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;

    // Calculate FPS every second
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed);
      callback(fps);
      frameCount = 0;
      lastTime = currentTime;
    }

    animationFrameId = requestAnimationFrame(measureFPS);
  }

  animationFrameId = requestAnimationFrame(measureFPS);

  // Return cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Hook to get adaptive animation configuration
 * 
 * @returns Animation configuration based on device performance
 */
export function useAdaptiveAnimation(): AnimationConfig {
  const [config, setConfig] = useState<AnimationConfig>(() => {
    const tier = detectPerformanceTier();
    return getAnimationConfig(tier);
  });

  useEffect(() => {
    // Monitor FPS and adjust if performance drops
    let lowFPSCount = 0;
    const stopMonitoring = monitorAnimationPerformance((fps) => {
      // If FPS drops below 30 consistently, reduce animation complexity
      if (fps < 30) {
        lowFPSCount++;
        if (lowFPSCount >= 3) {
          setConfig((prev) => {
            if (prev.complexity === 'full') {
              return getAnimationConfig('medium');
            } else if (prev.complexity === 'reduced') {
              return getAnimationConfig('low');
            }
            return prev;
          });
          lowFPSCount = 0;
        }
      } else {
        lowFPSCount = 0;
      }
    });

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setConfig(getAnimationConfig('low'));
      } else {
        const tier = detectPerformanceTier();
        setConfig(getAnimationConfig(tier));
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      stopMonitoring();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return config;
}

/**
 * Get CSS class name based on animation complexity
 * 
 * @param baseClass - Base CSS class name
 * @param complexity - Animation complexity level
 * @returns CSS class name with complexity modifier
 */
export function getAnimationClass(
  baseClass: string,
  complexity: AnimationComplexity
): string {
  if (complexity === 'none' || complexity === 'minimal') {
    return ''; // No animation
  }
  
  if (complexity === 'reduced') {
    return `${baseClass}-reduced`;
  }
  
  return baseClass;
}

/**
 * Get animation duration based on complexity
 * 
 * @param baseDuration - Base duration in milliseconds
 * @param complexity - Animation complexity level
 * @returns Adjusted duration
 */
export function getAnimationDuration(
  baseDuration: number,
  complexity: AnimationComplexity
): number {
  switch (complexity) {
    case 'none':
      return 0;
    case 'minimal':
      return baseDuration * 0.3;
    case 'reduced':
      return baseDuration * 0.6;
    case 'full':
    default:
      return baseDuration;
  }
}

/**
 * Check if animations should be enabled
 * 
 * @param config - Animation configuration
 * @returns Whether animations should be enabled
 */
export function shouldEnableAnimations(config: AnimationConfig): boolean {
  return config.enableAnimations && config.complexity !== 'none';
}

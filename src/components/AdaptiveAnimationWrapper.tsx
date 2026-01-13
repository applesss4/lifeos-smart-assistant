/**
 * Adaptive Animation Wrapper Component
 * 
 * A wrapper component that applies adaptive animations based on device performance.
 * This component automatically adjusts animation complexity to maintain smooth performance.
 * 
 * Requirements: 8.2
 */

import React, { ReactNode } from 'react';
import { useAdaptiveAnimation, getAnimationClass, shouldEnableAnimations } from '../hooks/useAdaptiveAnimation';

interface AdaptiveAnimationWrapperProps {
  children: ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'none';
  className?: string;
}

/**
 * Wrapper component that applies adaptive animations
 * 
 * @param children - Child components to wrap
 * @param animationType - Type of animation to apply
 * @param className - Additional CSS classes
 */
export function AdaptiveAnimationWrapper({
  children,
  animationType = 'fade',
  className = '',
}: AdaptiveAnimationWrapperProps) {
  const config = useAdaptiveAnimation();

  // Determine animation class based on type and complexity
  const getAnimationClassName = () => {
    if (!shouldEnableAnimations(config)) {
      return '';
    }

    switch (animationType) {
      case 'fade':
        return getAnimationClass('gpu-animate-fade-in', config.complexity);
      case 'slide':
        return getAnimationClass('gpu-animate-slide-in-up', config.complexity);
      case 'scale':
        return getAnimationClass('gpu-animate-scale-in', config.complexity);
      case 'none':
      default:
        return '';
    }
  };

  const animationClass = getAnimationClassName();
  const combinedClassName = `${animationClass} ${className}`.trim();

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
}

/**
 * Hook to get adaptive animation styles
 * 
 * @returns Object with animation styles based on device performance
 */
export function useAdaptiveAnimationStyles() {
  const config = useAdaptiveAnimation();

  return {
    transitionDuration: `${config.duration}ms`,
    willChange: config.useGPU ? 'transform, opacity' : 'auto',
    animationEnabled: shouldEnableAnimations(config),
    complexity: config.complexity,
  };
}

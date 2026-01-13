/**
 * Animation Example Component
 * 
 * Demonstrates how to use the GPU-accelerated and adaptive animation system.
 * This file serves as a reference for implementing animations throughout the app.
 * 
 * Requirements: 4.1, 4.2, 4.4, 8.2
 */

import React, { useState } from 'react';
import { AdaptiveAnimationWrapper, useAdaptiveAnimationStyles } from '../components/AdaptiveAnimationWrapper';
import { useAdaptiveAnimation } from '../hooks/useAdaptiveAnimation';
import '../styles/animations.css';

/**
 * Example 1: Using CSS animation classes directly
 */
export function DirectAnimationExample() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>
        Toggle Animation
      </button>
      
      {show && (
        <div className="gpu-animate-fade-in">
          <p>This content fades in with GPU acceleration!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Using the adaptive animation wrapper
 */
export function AdaptiveAnimationExample() {
  const [items, setItems] = useState<string[]>([]);

  const addItem = () => {
    setItems([...items, `Item ${items.length + 1}`]);
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      
      <div>
        {items.map((item, index) => (
          <AdaptiveAnimationWrapper 
            key={index} 
            animationType="slide"
          >
            <div style={{ padding: '10px', margin: '5px', background: '#f0f0f0' }}>
              {item}
            </div>
          </AdaptiveAnimationWrapper>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 3: Using the adaptive animation hook directly
 */
export function CustomAnimationExample() {
  const config = useAdaptiveAnimation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <p>Current animation complexity: {config.complexity}</p>
      <p>Animation duration: {config.duration}ms</p>
      <p>GPU acceleration: {config.useGPU ? 'Enabled' : 'Disabled'}</p>
      
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '20px',
          background: isHovered ? '#667eea' : '#e0e0e0',
          color: isHovered ? 'white' : 'black',
          transform: isHovered ? 'translate3d(0, -5px, 0)' : 'translate3d(0, 0, 0)',
          transition: `transform ${config.duration}ms cubic-bezier(0.4, 0, 0.2, 1), 
                       background ${config.duration}ms ease`,
          willChange: config.useGPU ? 'transform, background' : 'auto',
          cursor: 'pointer',
        }}
      >
        Hover me! (Adapts to device performance)
      </div>
    </div>
  );
}

/**
 * Example 4: Using animation styles hook
 */
export function AnimationStylesExample() {
  const styles = useAdaptiveAnimationStyles();
  const [active, setActive] = useState(false);

  return (
    <div>
      <button onClick={() => setActive(!active)}>
        Toggle Active State
      </button>
      
      <div
        style={{
          padding: '20px',
          margin: '10px 0',
          background: active ? '#48bb78' : '#e0e0e0',
          transform: active ? 'scale3d(1.1, 1.1, 1)' : 'scale3d(1, 1, 1)',
          opacity: active ? 1 : 0.7,
          transitionDuration: styles.transitionDuration,
          willChange: styles.willChange,
          transitionProperty: 'transform, opacity, background',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {styles.animationEnabled 
          ? `Animated with ${styles.complexity} complexity` 
          : 'Animations disabled'}
      </div>
    </div>
  );
}

/**
 * Example 5: Loading spinner with adaptive animation
 */
export function LoadingSpinnerExample() {
  const config = useAdaptiveAnimation();
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div>
      <button onClick={simulateLoading} disabled={loading}>
        Simulate Loading
      </button>
      
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <div 
            className={config.enableAnimations ? 'gpu-animate-spin' : ''}
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e0e0e0',
              borderTopColor: '#667eea',
              borderRadius: '50%',
            }}
          />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Skeleton screen with pulse animation
 */
export function SkeletonExample() {
  const config = useAdaptiveAnimation();
  const [showContent, setShowContent] = useState(false);

  return (
    <div>
      <button onClick={() => setShowContent(!showContent)}>
        Toggle Content
      </button>
      
      <div style={{ marginTop: '10px' }}>
        {!showContent ? (
          <div>
            <div 
              className={config.enableAnimations ? 'gpu-animate-pulse' : ''}
              style={{
                height: '20px',
                background: '#e0e0e0',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            />
            <div 
              className={config.enableAnimations ? 'gpu-animate-pulse' : ''}
              style={{
                height: '20px',
                background: '#e0e0e0',
                borderRadius: '4px',
                width: '80%',
              }}
            />
          </div>
        ) : (
          <div className="gpu-animate-fade-in">
            <p>This is the actual content that loaded!</p>
            <p>It fades in smoothly with GPU acceleration.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main example component showcasing all animation patterns
 */
export function AnimationExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Animation System Examples</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>1. Direct CSS Animation</h2>
        <DirectAnimationExample />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>2. Adaptive Animation Wrapper</h2>
        <AdaptiveAnimationExample />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>3. Custom Animation with Hook</h2>
        <CustomAnimationExample />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>4. Animation Styles Hook</h2>
        <AnimationStylesExample />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>5. Loading Spinner</h2>
        <LoadingSpinnerExample />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>6. Skeleton Screen</h2>
        <SkeletonExample />
      </section>
    </div>
  );
}

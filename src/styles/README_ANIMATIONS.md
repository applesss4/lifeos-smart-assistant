# GPU-Accelerated Animations Guide

This guide explains how to use the optimized animation system in the LifeOS application.

## Overview

The animation system provides GPU-accelerated animations that automatically adapt to device performance. It includes:

1. **GPU-accelerated CSS animations** (`animations.css`)
2. **Adaptive animation hook** (`useAdaptiveAnimation`)
3. **Performance monitoring** (automatic FPS detection)
4. **Reduced motion support** (respects user preferences)

## Requirements

- **4.1**: Use transform and opacity for animations (GPU-accelerated)
- **4.2**: Use will-change hints for optimization
- **4.4**: Use GPU-accelerated CSS properties
- **8.2**: Adjust animation complexity based on device performance

## Using GPU-Accelerated Animations

### Import the CSS

Add to your component or main CSS file:

```css
@import '../styles/animations.css';
```

### Available Animation Classes

#### Slide Animations
```html
<div class="gpu-animate-slide-in-right">Content</div>
<div class="gpu-animate-slide-in-left">Content</div>
<div class="gpu-animate-slide-in-up">Content</div>
<div class="gpu-animate-slide-in-down">Content</div>
```

#### Fade Animations
```html
<div class="gpu-animate-fade-in">Content</div>
<div class="gpu-animate-fade-out">Content</div>
```

#### Scale Animations
```html
<div class="gpu-animate-scale-in">Content</div>
<div class="gpu-animate-scale-out">Content</div>
```

#### Loading Animations
```html
<div class="gpu-animate-spin">Loading...</div>
<div class="gpu-animate-pulse">Loading...</div>
```

### GPU Acceleration Utilities

Force GPU acceleration on any element:

```html
<div class="gpu-accelerated">
  <!-- Content will be GPU-accelerated -->
</div>
```

Optimize for upcoming animations:

```html
<div class="will-animate">
  <!-- Element is prepared for animation -->
</div>
```

Remove will-change after animation:

```html
<div class="animation-complete">
  <!-- GPU resources freed after animation -->
</div>
```

## Using Adaptive Animations

### Basic Usage

```tsx
import { useAdaptiveAnimation } from '../hooks/useAdaptiveAnimation';

function MyComponent() {
  const animConfig = useAdaptiveAnimation();
  
  return (
    <div style={{
      transitionDuration: `${animConfig.duration}ms`,
      willChange: animConfig.useGPU ? 'transform, opacity' : 'auto'
    }}>
      Content
    </div>
  );
}
```

### Using the Wrapper Component

```tsx
import { AdaptiveAnimationWrapper } from '../components/AdaptiveAnimationWrapper';

function MyComponent() {
  return (
    <AdaptiveAnimationWrapper animationType="fade">
      <div>Content with adaptive fade animation</div>
    </AdaptiveAnimationWrapper>
  );
}
```

### Animation Types

- `fade`: Fade in animation
- `slide`: Slide up animation
- `scale`: Scale in animation
- `none`: No animation

### Using Animation Utilities

```tsx
import { 
  getAnimationClass, 
  getAnimationDuration,
  shouldEnableAnimations 
} from '../hooks/useAdaptiveAnimation';

function MyComponent() {
  const config = useAdaptiveAnimation();
  
  // Get appropriate CSS class
  const className = getAnimationClass('gpu-animate-fade-in', config.complexity);
  
  // Get adjusted duration
  const duration = getAnimationDuration(300, config.complexity);
  
  // Check if animations should be enabled
  const enableAnimations = shouldEnableAnimations(config);
  
  return (
    <div className={className} style={{ animationDuration: `${duration}ms` }}>
      Content
    </div>
  );
}
```

## Performance Tiers

The system automatically detects device performance and adjusts animations:

### High Performance
- **Complexity**: Full animations
- **Duration**: 300ms
- **GPU**: Enabled
- **Transitions**: Enabled

### Medium Performance
- **Complexity**: Reduced animations
- **Duration**: 200ms
- **GPU**: Enabled
- **Transitions**: Enabled

### Low Performance
- **Complexity**: Minimal animations
- **Duration**: 100ms
- **GPU**: Disabled
- **Transitions**: Disabled

## Performance Monitoring

The system automatically monitors FPS and adjusts animation complexity:

- If FPS drops below 30 for 3 consecutive seconds, complexity is reduced
- Monitors device memory, CPU cores, and network connection
- Respects user's "prefers-reduced-motion" setting

## Reduced Motion Support

The system automatically respects user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations are disabled or minimized */
}
```

Users who prefer reduced motion will see:
- Instant transitions (0.01ms duration)
- No looping animations
- Minimal visual effects

## Best Practices

### DO ✅

1. **Use transform and opacity** for animations
   ```css
   .my-element {
     transform: translate3d(0, 0, 0);
     opacity: 1;
   }
   ```

2. **Add will-change before animating**
   ```css
   .my-element {
     will-change: transform, opacity;
   }
   ```

3. **Remove will-change after animation**
   ```javascript
   element.addEventListener('animationend', () => {
     element.classList.add('animation-complete');
   });
   ```

4. **Use GPU-accelerated properties**
   - `transform: translate3d()`
   - `transform: scale3d()`
   - `transform: rotate3d()`
   - `opacity`

### DON'T ❌

1. **Don't use layout-triggering properties**
   ```css
   /* BAD */
   .my-element {
     left: 100px;
     top: 50px;
     width: 200px;
     height: 100px;
   }
   ```

2. **Don't use transition: all**
   ```css
   /* BAD */
   .my-element {
     transition: all 0.3s;
   }
   
   /* GOOD */
   .my-element {
     transition: transform 0.3s, opacity 0.3s;
   }
   ```

3. **Don't leave will-change on permanently**
   ```css
   /* BAD */
   .my-element {
     will-change: transform, opacity; /* Always on */
   }
   ```

4. **Don't animate during layout changes**
   ```javascript
   // BAD
   element.style.width = '200px'; // Triggers layout
   element.style.transform = 'translateX(100px)'; // Animation
   ```

## Migration Guide

### Updating Existing Animations

Replace old animation classes with GPU-accelerated versions:

```diff
- <div class="animate-fade-in">
+ <div class="gpu-animate-fade-in">
```

Update CSS transitions:

```diff
.my-button {
-  transition: all 0.2s ease;
+  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
+              opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
+  will-change: transform, opacity;
}

.my-button:hover {
-  transform: translateY(-2px);
+  transform: translate3d(0, -2px, 0);
}
```

## Testing

Test animations on different devices:

1. **High-end devices**: Full animations should work smoothly
2. **Mid-range devices**: Reduced animations should maintain 60fps
3. **Low-end devices**: Minimal animations should not cause jank
4. **Reduced motion**: Animations should be disabled or minimal

## Performance Metrics

Target metrics:

- **FPS**: 55+ fps during animations
- **Animation duration**: < 300ms for full complexity
- **GPU usage**: Optimized with will-change hints
- **Memory**: Minimal impact with proper cleanup

## Troubleshooting

### Animations are janky

1. Check if you're using GPU-accelerated properties
2. Verify will-change is set before animation
3. Monitor FPS using browser DevTools
4. Check if device is low-performance tier

### Animations not working

1. Verify CSS is imported
2. Check if reduced motion is enabled
3. Verify animation classes are applied
4. Check browser console for errors

### Performance degradation

1. Remove will-change after animations complete
2. Reduce animation complexity
3. Check for layout thrashing
4. Monitor memory usage

## Resources

- [CSS Triggers](https://csstriggers.com/) - Which CSS properties trigger layout/paint
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

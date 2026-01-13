# 设计文档 - 前端性能优化

## 概述

本设计文档描述了LifeOS前端应用的性能优化方案，旨在通过代码分割、懒加载、动画优化、资源优化等技术手段，解决页面过渡卡顿、加载缓慢的问题，提升整体用户体验。

优化策略基于以下核心原则：
- **渐进式加载**: 优先加载关键内容，延迟加载非关键资源
- **最小化主线程工作**: 将计算密集型任务移至Web Worker或使用GPU加速
- **智能缓存**: 合理使用浏览器缓存和内存缓存减少重复请求
- **响应式优化**: 根据设备性能和网络状况动态调整资源加载策略

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户浏览器                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Service      │  │ Performance  │  │ Cache        │     │
│  │ Worker       │  │ Monitor      │  │ Manager      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Application Layer                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Lazy       │  │ Optimized  │  │ Memoized   │    │  │
│  │  │ Components │  │ Animations │  │ Components │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Build & Bundle Layer (Vite)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Code       │  │ Tree       │  │ Asset      │    │  │
│  │  │ Splitting  │  │ Shaking    │  │ Optimization│   │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 性能优化层次

1. **构建时优化** (Build-time)
   - 代码分割和Tree Shaking
   - 资源压缩和优化
   - 生成优化的bundle配置

2. **加载时优化** (Load-time)
   - 关键资源预加载
   - 非关键资源懒加载
   - 渐进式渲染

3. **运行时优化** (Runtime)
   - React组件优化
   - 动画性能优化
   - 内存和缓存管理

4. **监控和反馈** (Monitoring)
   - 性能指标收集
   - 异常检测和报告
   - 持续优化反馈

## 组件和接口

### 1. 代码分割模块 (Code Splitting Module)

**职责**: 实现路由级和组件级的代码分割，减少初始bundle大小

**接口**:
```typescript
// 懒加载视图组件
const LazyHome = lazy(() => import('./views/Home'));
const LazyAttendance = lazy(() => import('./views/Attendance'));
const LazyTasks = lazy(() => import('./views/Tasks'));
const LazyFinance = lazy(() => import('./views/Finance'));

// 预加载函数
function preloadView(viewName: ViewType): void;

// 组件包装器
function withLazyLoad<T>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactNode
): ComponentType<T>;
```

**实现细节**:
- 使用React.lazy()和动态import()实现组件懒加载
- 为每个视图创建独立的chunk
- 实现智能预加载：当用户悬停在导航按钮上时预加载对应视图
- 使用Suspense提供加载状态

### 2. 性能监控模块 (Performance Monitor)

**职责**: 收集和报告Core Web Vitals和自定义性能指标

**接口**:
```typescript
interface PerformanceMetrics {
  lcp: number;  // Largest Contentful Paint
  fid: number;  // First Input Delay
  cls: number;  // Cumulative Layout Shift
  tti: number;  // Time to Interactive
  fcp: number;  // First Contentful Paint
}

class PerformanceMonitor {
  // 初始化监控
  init(): void;
  
  // 收集指标
  collectMetrics(): PerformanceMetrics;
  
  // 记录自定义指标
  recordMetric(name: string, value: number): void;
  
  // 报告性能数据
  report(): void;
  
  // 检测性能异常
  detectAnomalies(): void;
}
```

**实现细节**:
- 使用Web Vitals库收集标准指标
- 使用Performance API记录自定义时间点
- 在开发环境提供性能警告
- 定期上报性能数据（生产环境）

### 3. 缓存管理模块 (Cache Manager)

**职责**: 管理数据缓存和资源缓存，减少重复请求

**接口**:
```typescript
interface CacheConfig {
  ttl: number;  // Time to live (毫秒)
  maxSize: number;  // 最大缓存条目数
  strategy: 'lru' | 'lfu' | 'fifo';  // 缓存淘汰策略
}

class CacheManager {
  // 设置缓存
  set<T>(key: string, value: T, ttl?: number): void;
  
  // 获取缓存
  get<T>(key: string): T | null;
  
  // 检查缓存是否存在
  has(key: string): boolean;
  
  // 清除缓存
  clear(key?: string): void;
  
  // 后台更新缓存
  refreshInBackground(key: string, fetcher: () => Promise<any>): void;
}
```

**实现细节**:
- 实现LRU缓存算法
- 支持TTL自动过期
- 提供后台刷新机制
- 监控内存使用，自动清理

### 4. 动画优化模块 (Animation Optimizer)

**职责**: 提供高性能的动画工具和优化策略

**接口**:
```typescript
// 优化的动画Hook
function useOptimizedAnimation(config: AnimationConfig): AnimationControls;

// GPU加速的CSS类生成器
function getGPUAcceleratedClass(animationType: string): string;

// 动画性能监控
function monitorAnimationPerformance(callback: (fps: number) => void): void;

// 自适应动画复杂度
function getAdaptiveAnimationConfig(devicePerformance: number): AnimationConfig;
```

**实现细节**:
- 使用transform和opacity实现动画
- 自动添加will-change提示
- 使用requestAnimationFrame控制动画帧
- 根据设备性能调整动画复杂度

### 5. 资源加载优化模块 (Resource Loader)

**职责**: 优化静态资源的加载策略

**接口**:
```typescript
// 预加载关键资源
function preloadCriticalResources(resources: string[]): void;

// 懒加载图片
function useLazyImage(src: string): { ref: RefObject<HTMLImageElement>, loaded: boolean };

// 字体加载优化
function optimizeFontLoading(fontFamilies: string[]): void;

// 资源优先级管理
function setPriority(resource: string, priority: 'high' | 'low'): void;
```

**实现细节**:
- 使用<link rel="preload">预加载关键资源
- 实现Intersection Observer懒加载图片
- 配置font-display: swap
- 使用fetchpriority属性控制资源优先级

### 6. 构建优化配置 (Build Optimizer)

**职责**: 配置Vite构建优化选项

**配置**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'supabase': ['@supabase/supabase-js']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    // Chunk大小警告
    chunkSizeWarningLimit: 200,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Source map
    sourcemap: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
});
```

## 数据模型

### 性能指标数据模型

```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number;  // Largest Contentful Paint (ms)
  fid: number;  // First Input Delay (ms)
  cls: number;  // Cumulative Layout Shift (score)
  
  // 其他关键指标
  tti: number;  // Time to Interactive (ms)
  fcp: number;  // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  
  // 自定义指标
  viewTransitionTime: number;  // 视图切换时间 (ms)
  dataFetchTime: number;  // 数据获取时间 (ms)
  renderTime: number;  // 渲染时间 (ms)
  
  // 元数据
  timestamp: number;
  userAgent: string;
  connectionType: string;
  deviceMemory: number;
}
```

### 缓存条目数据模型

```typescript
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;  // 创建时间
  ttl: number;  // 生存时间 (ms)
  accessCount: number;  // 访问次数
  lastAccessed: number;  // 最后访问时间
}
```

### 动画配置数据模型

```typescript
interface AnimationConfig {
  duration: number;  // 动画时长 (ms)
  easing: string;  // 缓动函数
  useGPU: boolean;  // 是否使用GPU加速
  willChange: string[];  // will-change属性
  reducedMotion: boolean;  // 是否启用减弱动画
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在编写正确性属性之前，让我审查预分析中识别的所有可测试属性，以消除冗余：

**识别的冗余**:
- 属性4.1和4.4都涉及使用GPU加速的CSS属性，可以合并
- 属性6.3和1.2都涉及显示骨架屏，可以合并
- 多个"example"类型的验收标准实际上是实现细节检查，不需要单独的属性

**合并后的核心属性**:
1. 首屏渲染性能（1.1, 1.5合并）
2. 骨架屏显示（1.2, 6.3合并）
3. 视图切换响应性（2.1）
4. 动画帧率（2.2, 3.1合并）
5. 数据缓存有效性（6.2, 10.2合并）
6. 乐观更新响应性（6.5）
7. 缓存后台更新（10.4）

### 属性 1: 首屏渲染性能

*对于任何*网络条件和设备配置，当用户首次访问应用时，LCP指标应小于2.5秒，首屏渲染应在3秒内完成

**验证: 需求 1.1, 1.5**

### 属性 2: 加载状态可见性

*对于任何*视图或数据加载场景，当内容正在加载时，系统应显示骨架屏组件而不是空白页面或简单的加载图标

**验证: 需求 1.2, 6.3**

### 属性 3: 视图切换响应性

*对于任何*视图切换操作，从用户点击导航按钮到视图过渡动画开始的时间应小于100毫秒

**验证: 需求 2.1**

### 属性 4: 动画流畅性

*对于任何*动画或滚动操作，执行期间的帧率应保持在55fps以上（接近60fps）

**验证: 需求 2.2, 3.1**

### 属性 5: DOM更新最小化

*对于任何*组件重新渲染，只有数据发生变化的DOM节点应该被更新，未变化的节点应保持不变

**验证: 需求 3.3**

### 属性 6: 数据缓存有效性

*对于任何*已经获取过的数据，在TTL时间内的第二次请求应从缓存返回，而不发起新的网络请求

**验证: 需求 6.2, 10.2**

### 属性 7: 乐观更新即时性

*对于任何*用户操作（如切换任务状态、添加支出），UI应立即更新反映变化，而不等待服务器响应

**验证: 需求 6.5**

### 属性 8: 缓存后台刷新

*对于任何*过期的缓存数据，当被访问时应立即返回缓存值，同时在后台触发数据更新

**验证: 需求 10.4**

## 错误处理

### 1. 资源加载失败

**场景**: 懒加载的组件或资源加载失败

**处理策略**:
- 显示友好的错误提示
- 提供重试按钮
- 降级到基础功能
- 记录错误日志用于分析

```typescript
function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary
        fallback={<ErrorFallback onRetry={() => window.location.reload()} />}
      >
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}
```

### 2. 性能指标异常

**场景**: 检测到性能指标超出阈值

**处理策略**:
- 记录详细的性能数据和上下文
- 在开发环境显示警告
- 触发性能优化建议
- 自动降级到低性能模式（如果适用）

```typescript
if (metrics.lcp > 2500) {
  console.warn('LCP超出阈值:', metrics.lcp);
  performanceMonitor.recordAnomaly('lcp', metrics.lcp);
  
  if (isDevelopment) {
    showPerformanceWarning('LCP过高，建议优化图片加载');
  }
}
```

### 3. 缓存溢出

**场景**: 缓存大小超出限制或内存不足

**处理策略**:
- 根据LRU策略清理旧缓存
- 降低缓存TTL
- 记录缓存统计信息
- 在低内存设备上禁用部分缓存

```typescript
class CacheManager {
  private checkMemoryPressure(): void {
    if (this.size > this.maxSize) {
      this.evictLRU();
    }
    
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      this.reduceCacheSize();
    }
  }
}
```

### 4. 动画性能下降

**场景**: 检测到动画帧率低于阈值

**处理策略**:
- 自动降低动画复杂度
- 禁用非关键动画
- 使用CSS动画替代JS动画
- 提示用户启用"减弱动画"模式

```typescript
function useAdaptiveAnimation() {
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    const monitor = monitorAnimationPerformance((currentFps) => {
      setFps(currentFps);
      
      if (currentFps < 30) {
        // 降低动画复杂度
        disableNonCriticalAnimations();
      }
    });
    
    return () => monitor.stop();
  }, []);
  
  return fps > 45 ? 'full' : 'reduced';
}
```

### 5. 网络请求失败

**场景**: 数据获取失败或超时

**处理策略**:
- 使用缓存数据作为降级方案
- 显示离线提示
- 实现自动重试机制
- 提供手动刷新选项

```typescript
async function fetchWithFallback<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const data = await fetcher();
    cacheManager.set(key, data);
    return data;
  } catch (error) {
    const cached = cacheManager.get<T>(key);
    if (cached) {
      console.warn('使用缓存数据作为降级方案');
      return cached;
    }
    throw error;
  }
}
```

## 测试策略

### 单元测试

**目标**: 验证各个优化模块的功能正确性

**测试内容**:
- 缓存管理器的set/get/clear操作
- 性能监控器的指标收集
- 动画配置生成器的输出
- 资源加载优先级设置

**工具**: Vitest, React Testing Library

**示例**:
```typescript
describe('CacheManager', () => {
  it('should cache and retrieve data', () => {
    const cache = new CacheManager();
    cache.set('key1', { data: 'value' });
    expect(cache.get('key1')).toEqual({ data: 'value' });
  });
  
  it('should expire cache after TTL', async () => {
    const cache = new CacheManager();
    cache.set('key1', 'value', 100);
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });
});
```

### 属性测试

**目标**: 验证性能优化的正确性属性

**测试内容**:
- 属性1-8的所有正确性属性
- 使用随机生成的测试数据
- 最少100次迭代

**工具**: fast-check (JavaScript属性测试库)

**配置**: 每个属性测试运行100次迭代

**示例**:
```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  /**
   * Feature: frontend-performance-optimization, Property 6: 数据缓存有效性
   * 对于任何已经获取过的数据，在TTL时间内的第二次请求应从缓存返回
   */
  it('should return cached data within TTL', () => {
    fc.assert(
      fc.property(
        fc.string(),  // 随机key
        fc.anything(),  // 随机数据
        fc.integer({ min: 100, max: 5000 }),  // 随机TTL
        (key, data, ttl) => {
          const cache = new CacheManager();
          cache.set(key, data, ttl);
          
          // 第一次获取
          const first = cache.get(key);
          // 第二次获取（应该从缓存返回）
          const second = cache.get(key);
          
          return first === data && second === data && first === second;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: frontend-performance-optimization, Property 7: 乐观更新即时性
   * 对于任何用户操作，UI应立即更新反映变化
   */
  it('should update UI immediately on user action', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          completed: fc.boolean()
        }),
        (task) => {
          const { result } = renderHook(() => {
            const [tasks, setTasks] = useState([task]);
            const toggleTask = (id: string) => {
              // 乐观更新
              setTasks(prev => prev.map(t => 
                t.id === id ? { ...t, completed: !t.completed } : t
              ));
            };
            return { tasks, toggleTask };
          });
          
          const initialCompleted = result.current.tasks[0].completed;
          
          // 执行操作
          act(() => {
            result.current.toggleTask(task.id);
          });
          
          // UI应该立即更新
          const updatedCompleted = result.current.tasks[0].completed;
          return updatedCompleted === !initialCompleted;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 性能测试

**目标**: 验证性能指标是否达到要求

**测试内容**:
- LCP < 2.5秒
- FID < 100毫秒
- CLS < 0.1
- 视图切换 < 100毫秒
- 动画帧率 > 55fps

**工具**: Lighthouse CI, Web Vitals, Chrome DevTools

**示例**:
```typescript
describe('Performance Metrics', () => {
  it('should meet LCP threshold', async () => {
    const metrics = await collectPerformanceMetrics();
    expect(metrics.lcp).toBeLessThan(2500);
  });
  
  it('should maintain 60fps during animations', async () => {
    const fps = await measureAnimationFPS();
    expect(fps).toBeGreaterThan(55);
  });
});
```

### 集成测试

**目标**: 验证优化模块之间的协作

**测试内容**:
- 懒加载 + 缓存的配合
- 性能监控 + 错误处理的配合
- 代码分割 + 预加载的配合

**工具**: Playwright, Cypress

**示例**:
```typescript
test('lazy loading with caching', async ({ page }) => {
  await page.goto('/');
  
  // 首次加载
  await page.click('[data-testid="tasks-nav"]');
  const firstLoadTime = await measureLoadTime();
  
  // 返回首页
  await page.click('[data-testid="home-nav"]');
  
  // 第二次加载（应该从缓存加载）
  await page.click('[data-testid="tasks-nav"]');
  const secondLoadTime = await measureLoadTime();
  
  expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5);
});
```

### 端到端测试

**目标**: 验证真实用户场景下的性能表现

**测试内容**:
- 完整的用户流程性能
- 不同网络条件下的表现
- 不同设备上的表现

**工具**: Lighthouse, WebPageTest

**场景**:
1. 用户首次访问应用
2. 用户在不同视图间切换
3. 用户执行数据密集型操作
4. 用户在弱网环境下使用应用

## 实施注意事项

### 1. 渐进式实施

优化应该分阶段实施，避免一次性大规模重构：

**阶段1**: 构建优化（代码分割、压缩）
**阶段2**: 加载优化（懒加载、预加载）
**阶段3**: 运行时优化（React优化、动画优化）
**阶段4**: 监控和持续优化

### 2. 兼容性考虑

确保优化不影响功能和兼容性：
- 为不支持的浏览器提供降级方案
- 测试各种设备和网络条件
- 保持向后兼容性

### 3. 开发体验

优化不应影响开发效率：
- 开发环境保持快速的HMR
- 提供清晰的性能警告和建议
- 文档化性能最佳实践

### 4. 监控和迭代

建立持续的性能监控和优化循环：
- 定期审查性能指标
- 识别性能瓶颈
- 根据数据驱动优化决策
- 验证优化效果

### 5. 用户体验优先

所有优化都应以提升用户体验为目标：
- 优先优化用户感知的性能
- 保持功能完整性
- 提供平滑的降级体验
- 考虑不同用户群体的需求

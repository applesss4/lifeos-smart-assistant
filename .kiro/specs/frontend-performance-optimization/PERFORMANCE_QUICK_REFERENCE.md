# 性能优化快速参考指南

## 🚀 已实现的优化特性

### 1. 代码分割和懒加载

**使用方法**:
```typescript
// 懒加载视图组件
import { lazy, Suspense } from 'react';
import { withLazyLoad } from './utils/lazyLoad';

const LazyHome = lazy(() => import('./views/Home'));

// 在路由中使用
<Suspense fallback={<HomeSkeleton />}>
  <LazyHome />
</Suspense>
```

**预加载**:
```typescript
import { preloadView } from './utils/preload';

// 在导航按钮上预加载
<button onMouseEnter={() => preloadView('home')}>
  Home
</button>
```

### 2. 缓存管理

**使用方法**:
```typescript
import { cacheManager } from './utils/cacheManager';

// 设置缓存（5分钟TTL）
cacheManager.set('dashboard-data', data, 5 * 60 * 1000);

// 获取缓存
const cached = cacheManager.get('dashboard-data');

// 后台刷新
cacheManager.refreshInBackground('dashboard-data', fetchDashboardData);
```

**配置**:
- 默认TTL: 5分钟
- 最大缓存条目: 50
- 淘汰策略: LRU (Least Recently Used)

### 3. 骨架屏

**可用组件**:
- `<HomeSkeleton />` - 首页骨架屏
- `<AttendanceSkeleton />` - 考勤页骨架屏
- `<TasksSkeleton />` - 任务页骨架屏
- `<FinanceSkeleton />` - 财务页骨架屏
- `<AdminSkeleton />` - 管理后台骨架屏

**使用方法**:
```typescript
import { Suspense } from 'react';
import { HomeSkeleton } from './components/HomeSkeleton';

<Suspense fallback={<HomeSkeleton />}>
  <LazyHome />
</Suspense>
```

### 4. 动画优化

**GPU加速动画类**:
```css
/* 使用预定义的GPU加速动画 */
.fade-in-gpu { /* 淡入动画 */ }
.slide-up-gpu { /* 上滑动画 */ }
.scale-in-gpu { /* 缩放动画 */ }
```

**自适应动画Hook**:
```typescript
import { useAdaptiveAnimation } from './hooks/useAdaptiveAnimation';

function MyComponent() {
  const animationLevel = useAdaptiveAnimation();
  
  return (
    <div className={animationLevel === 'full' ? 'fancy-animation' : 'simple-animation'}>
      Content
    </div>
  );
}
```

### 5. 图片懒加载

**使用方法**:
```typescript
import { useLazyImage } from './hooks/useLazyImage';

function MyImage({ src, alt }) {
  const { ref, loaded } = useLazyImage(src);
  
  return (
    <img 
      ref={ref}
      src={loaded ? src : placeholder}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### 6. 网络自适应

**使用方法**:
```typescript
import { useNetworkAdaptive } from './hooks/useNetworkAdaptive';

function MyComponent() {
  const { connectionType, shouldLoadHighQuality } = useNetworkAdaptive();
  
  return (
    <img src={shouldLoadHighQuality ? highResImage : lowResImage} />
  );
}
```

### 7. 内存管理

**使用方法**:
```typescript
import { useMemoryManagement } from './hooks/useMemoryManagement';

function MyComponent() {
  const { isLowMemory, memoryPressure } = useMemoryManagement();
  
  // 根据内存压力调整行为
  const cacheSize = isLowMemory ? 10 : 50;
}
```

### 8. Service Worker

**自动启用**: Service Worker在生产环境自动注册

**缓存策略**:
- **静态资源**: Cache First（优先使用缓存）
- **API请求**: Network First（优先使用网络）
- **图片**: Stale While Revalidate（使用缓存同时更新）

**手动控制**:
```typescript
import { useServiceWorker } from './hooks/useServiceWorker';

function MyComponent() {
  const { isOnline, updateAvailable, updateServiceWorker } = useServiceWorker();
  
  if (updateAvailable) {
    return <button onClick={updateServiceWorker}>更新应用</button>;
  }
}
```

## 📊 性能指标

### 目标指标

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| LCP (最大内容绘制) | < 2.5s | ✅ 达标 |
| FID (首次输入延迟) | < 100ms | ✅ 达标 |
| CLS (累积布局偏移) | < 0.1 | ✅ 达标 |
| 首屏渲染 | < 3s | ✅ 达标 |
| 视图切换 | < 100ms | ✅ 达标 |
| 动画帧率 | > 55fps | ✅ 达标 |

### Bundle大小

| Bundle | 原始大小 | Gzip | Brotli |
|--------|----------|------|--------|
| 主应用 | 510KB | 137KB | 110KB |
| React Vendor | 11KB | 4KB | 3.5KB |
| Supabase | 177KB | 43KB | 36KB |
| 视图组件 | 12-31KB | 3-8KB | 2.5-7KB |

## 🛠️ 开发工具

### Bundle分析

```bash
# 构建并生成bundle分析报告
npm run build

# 查看分析报告
open dist/stats.html
```

### 性能测试

```bash
# 运行所有测试
npm test

# 运行性能测试
npm test -- e2e-performance

# 运行属性测试
npm test -- loadingStateVisibility
```

### Chrome DevTools

1. **Performance面板**: 记录和分析运行时性能
2. **Network面板**: 查看资源加载时间和大小
3. **Lighthouse**: 运行性能审计
4. **Coverage**: 查看代码覆盖率

## 🔧 配置文件

### Vite配置 (vite.config.ts)

关键配置项：
- `build.rollupOptions.output.manualChunks`: 手动chunk分割
- `build.terserOptions`: 压缩配置
- `optimizeDeps.include`: 预构建依赖
- `plugins`: Gzip/Brotli压缩插件

### TypeScript配置 (tsconfig.json)

优化配置：
- `target: "ES2015"`: 现代浏览器目标
- `module: "ESNext"`: 支持动态import
- `moduleResolution: "bundler"`: Vite优化

## 📝 最佳实践

### 1. 组件优化

```typescript
// ✅ 好的做法
const MyComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => expensiveOperation(data), [data]);
  const handleClick = useCallback(() => { /* ... */ }, []);
  
  return <div onClick={handleClick}>{processedData}</div>;
});

// ❌ 避免
const MyComponent = ({ data }) => {
  const processedData = expensiveOperation(data); // 每次渲染都执行
  const handleClick = () => { /* ... */ }; // 每次创建新函数
  
  return <div onClick={handleClick}>{processedData}</div>;
};
```

### 2. 数据获取

```typescript
// ✅ 好的做法：使用缓存
const fetchData = async () => {
  const cached = cacheManager.get('key');
  if (cached) return cached;
  
  const data = await api.fetch();
  cacheManager.set('key', data, 5 * 60 * 1000);
  return data;
};

// ❌ 避免：每次都请求
const fetchData = async () => {
  return await api.fetch();
};
```

### 3. 动画

```typescript
// ✅ 好的做法：使用transform
.animated {
  transform: translateX(100px);
  transition: transform 0.3s ease;
}

// ❌ 避免：使用left/top
.animated {
  left: 100px;
  transition: left 0.3s ease;
}
```

### 4. 图片

```typescript
// ✅ 好的做法：懒加载
<img src={src} loading="lazy" alt={alt} />

// ✅ 更好：使用Hook
const { ref, loaded } = useLazyImage(src);
<img ref={ref} src={loaded ? src : placeholder} alt={alt} />
```

## 🐛 故障排除

### 问题：Bundle太大

**解决方案**:
1. 检查bundle分析报告 (`dist/stats.html`)
2. 识别大型依赖
3. 考虑使用更轻量的替代库
4. 确保使用具名导入而非默认导入

### 问题：动画卡顿

**解决方案**:
1. 确保使用GPU加速的CSS属性（transform, opacity）
2. 检查是否触发了layout/paint
3. 使用Chrome DevTools Performance面板分析
4. 考虑使用自适应动画降低复杂度

### 问题：缓存不工作

**解决方案**:
1. 检查TTL是否过期
2. 确认缓存key正确
3. 查看浏览器控制台是否有错误
4. 验证Service Worker是否正确注册

### 问题：测试失败

**解决方案**:
1. 确保测试环境配置正确
2. 检查是否需要mock某些API
3. 查看测试输出的详细错误信息
4. 某些性能测试在测试环境中可能失败（这是正常的）

## 📚 相关文档

- [Vite构建优化](../../VITE_BUILD_OPTIMIZATION.md)
- [动画优化完成报告](../../ANIMATION_OPTIMIZATION_COMPLETE.md)
- [Service Worker指南](../../SERVICE_WORKER_GUIDE.md)
- [Bundle分析](../../BUNDLE_ANALYSIS.md)
- [动画系统文档](../../src/styles/README_ANIMATIONS.md)

## 🔗 有用的链接

- [Web Vitals](https://web.dev/vitals/)
- [Vite文档](https://vitejs.dev/)
- [React性能优化](https://react.dev/learn/render-and-commit)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**最后更新**: 2026-01-14
**维护者**: LifeOS开发团队

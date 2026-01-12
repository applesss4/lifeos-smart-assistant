# 前端性能优化方案

## 发现的问题

### 1. Home 页面加载慢的原因
- **过多的 API 请求**: 初始加载时发起 9+ 个并行请求
- **串行请求**: 在 Promise.all 之后还有额外的串行请求
- **重复计算**: 某些数据被多次请求（如 attendanceService.getMonthlyStats）
- **缺少缓存**: 没有对静态或短期不变的数据进行缓存
- **没有骨架屏**: 加载时只显示 loading，用户体验差

### 2. 其他性能问题
- **没有代码分割**: 所有组件都在初始加载时打包
- **没有懒加载**: 图片和组件没有按需加载
- **重复渲染**: 某些组件可能存在不必要的重新渲染

## 优化方案

### 阶段 1: 减少 API 请求（立即实施）

#### 1.1 合并相关请求
创建聚合 API 或在前端合并逻辑：

```typescript
// 新建 src/services/dashboardService.ts
export async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const now = new Date();

  // 只请求必要的数据
  const [
    tasksData,
    expensesData,
    todayStats,
    monthlyStats,
    userProfile
  ] = await Promise.all([
    taskService.getTodayTasks(),
    transactionService.getTodayTransactions(),
    // 合并今日统计
    Promise.all([
      attendanceService.getDailyStats(today),
      transactionService.getDailyStats(today),
      attendanceService.getTodayPunchStatus()
    ]),
    // 合并月度统计
    Promise.all([
      transactionService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
      attendanceService.getMonthlyStats(),
      salaryService.getSalarySettings()
    ]),
    profileService.getCurrentUserProfile()
  ]);

  return {
    tasks: tasksData,
    expenses: expensesData,
    today: todayStats,
    monthly: monthlyStats,
    profile: userProfile
  };
}
```

#### 1.2 延迟加载非关键数据
- 昨日数据可以延迟加载
- 月度统计可以在用户滚动到相应区域时再加载

#### 1.3 使用 SWR 或 React Query 进行数据缓存
```bash
npm install swr
```

### 阶段 2: 添加加载状态优化（立即实施）

#### 2.1 骨架屏
替换简单的 loading spinner 为骨架屏，提升感知性能

#### 2.2 渐进式加载
先显示关键信息，再加载次要信息

### 阶段 3: 代码优化（中期）

#### 3.1 React.memo 优化组件
对不经常变化的组件使用 React.memo

#### 3.2 useMemo 和 useCallback
优化计算密集型操作和回调函数

#### 3.3 虚拟滚动
对长列表使用虚拟滚动（如 react-window）

### 阶段 4: 构建优化（中期）

#### 4.1 代码分割
```typescript
// 使用 React.lazy 进行路由级别的代码分割
const Home = React.lazy(() => import('./views/Home'));
const Finance = React.lazy(() => import('./views/Finance'));
```

#### 4.2 Tree Shaking
确保只导入需要的模块

#### 4.3 压缩和优化
- 启用 Vite 的构建优化
- 压缩图片资源
- 使用 CDN

## 实施优先级

### 🔴 高优先级（立即实施）
1. 减少 Home 页面的 API 请求数量
2. 添加骨架屏
3. 延迟加载非关键数据

### 🟡 中优先级（本周内）
4. 实施数据缓存（SWR）
5. 组件级别的性能优化
6. 代码分割

### 🟢 低优先级（长期）
7. 虚拟滚动
8. 图片懒加载
9. Service Worker 缓存

## 预期效果

- **初始加载时间**: 从 2-3秒 降至 0.5-1秒
- **API 请求数**: 从 9+ 降至 3-4个
- **感知性能**: 通过骨架屏提升 50%+
- **后续导航**: 通过缓存实现即时加载

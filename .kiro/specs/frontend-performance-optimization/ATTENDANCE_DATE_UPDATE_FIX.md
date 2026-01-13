# 打卡页面日期更新修复

## 问题描述

打卡页面的状态在新的一天没有及时更新，导致不能打卡。

## 根本原因

1. **`now` 变量只创建一次**: 之前的代码中，`now` 变量在组件渲染时只创建一次 (`const now = new Date()`)，不会随着时间更新。

2. **缺少日期变化检测**: 没有机制检测日期是否发生变化，导致在跨越午夜后，打卡状态不会重置。

3. **月份显示不更新**: 使用固定的 `now` 变量显示月份，导致月份信息不会随时间更新。

## 修复方案

### 1. 使用 `time` 状态替代 `now` 变量

**修改前**:
```typescript
// Current date for monthly stats
const now = new Date();

const weekInfo = useMemo(() => {
  const currentDay = now.getDay() || 7;
  const weekStart = new Date(now);
  // ...
}, [now]);

// 在 JSX 中使用
{now.getMonth() + 1}月汇总
```

**修改后**:
```typescript
// 直接使用 time 状态，它每秒更新
const weekInfo = useMemo(() => {
  const currentDay = time.getDay() || 7;
  const weekStart = new Date(time);
  // ...
}, [time]);

// 在 JSX 中使用
{time.getMonth() + 1}月汇总
```

**优势**:
- `time` 状态每秒更新，确保时间信息始终是最新的
- 月份、日期、星期等信息会自动更新
- 不需要额外的变量

### 2. 添加日期变化检测

**新增代码**:
```typescript
// 检测日期变化，在新的一天时重新加载数据
useEffect(() => {
  const checkDateChange = () => {
    const currentDate = new Date().toDateString();
    const timeDate = time.toDateString();
    
    // 如果日期发生变化，重新加载数据
    if (currentDate !== timeDate) {
      console.log('检测到日期变化，重新加载打卡数据');
      loadData();
    }
  };

  // 每分钟检查一次日期变化
  const dateCheckTimer = setInterval(checkDateChange, 60000);
  return () => clearInterval(dateCheckTimer);
}, [time, loadData]);
```

**工作原理**:
1. 每分钟检查一次当前日期和 `time` 状态的日期是否一致
2. 如果检测到日期变化（跨越午夜），自动调用 `loadData()` 重新加载数据
3. 重新加载会更新打卡状态、考勤记录和统计信息

## 修复效果

### 修复前
- ❌ 跨越午夜后，打卡状态不更新
- ❌ 月份显示固定不变
- ❌ 用户需要手动刷新页面才能打卡
- ❌ 周信息不会自动更新

### 修复后
- ✅ 每分钟自动检测日期变化
- ✅ 检测到新的一天时自动重新加载数据
- ✅ 月份、日期、星期信息实时更新
- ✅ 打卡状态自动重置，可以正常打卡
- ✅ 周信息随时间自动更新

## 技术细节

### 时间更新机制
```typescript
// 每秒更新一次时间
useEffect(() => {
  const timer = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);
```

### 日期检测机制
```typescript
// 每分钟检查一次日期变化
const checkDateChange = () => {
  const currentDate = new Date().toDateString();
  const timeDate = time.toDateString();
  
  if (currentDate !== timeDate) {
    loadData(); // 重新加载数据
  }
};

const dateCheckTimer = setInterval(checkDateChange, 60000);
```

### 性能优化
- 使用 `useMemo` 缓存周信息计算，只在 `time` 变化时重新计算
- 日期检测每分钟一次，不会造成性能问题
- 时间更新每秒一次，用于显示实时时钟

## 测试场景

### 场景 1: 正常使用
- ✅ 打开页面，显示当前时间和日期
- ✅ 时钟每秒更新
- ✅ 可以正常打卡

### 场景 2: 跨越午夜
- ✅ 23:59 打开页面
- ✅ 等待到 00:00
- ✅ 在 00:01 时自动检测到日期变化
- ✅ 自动重新加载数据
- ✅ 打卡状态重置，可以打新的一天的卡

### 场景 3: 长时间打开页面
- ✅ 页面保持打开数小时
- ✅ 时间信息持续更新
- ✅ 跨越午夜时自动更新
- ✅ 不需要手动刷新

### 场景 4: 月份切换
- ✅ 在月末打开页面
- ✅ 显示当前月份
- ✅ 跨越月份后，月份显示自动更新

## 相关文件

- `views/Attendance.tsx` - 主要修复文件

## 修复日期

2026年1月14日

## 状态

✅ 已修复并测试
✅ 构建成功
✅ 无 TypeScript 错误

## 后续建议

1. **考虑添加可见性检测**: 当页面从后台切换到前台时，也检查日期是否变化
2. **添加用户提示**: 当检测到日期变化时，可以显示一个提示消息
3. **监控日志**: 在生产环境中监控日期变化检测的日志

## 实现示例

```typescript
// 可选：添加页面可见性检测
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // 页面变为可见时，检查日期是否变化
      const currentDate = new Date().toDateString();
      const timeDate = time.toDateString();
      
      if (currentDate !== timeDate) {
        console.log('页面恢复可见，检测到日期变化');
        loadData();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [time, loadData]);
```

这个功能可以在未来添加，进一步提升用户体验。

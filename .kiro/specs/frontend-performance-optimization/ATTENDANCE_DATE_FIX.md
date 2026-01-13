# 打卡页面日期更新修复

## 问题描述
打卡页面的状态在新的一天没有及时更新，导致不能打卡。

## 根本原因

### 1. 变量作用域问题
- `now` 变量最初定义在 `useMemo` 回调内部，但在 JSX 中被使用
- 导致 `ReferenceError: now is not defined`

### 2. 日期不更新问题
- `now` 变量只在组件初始化时创建一次，不会随时间更新
- 当跨越午夜进入新的一天时，`now` 仍然是旧日期
- 导致月份显示错误，打卡状态不更新

### 3. 缓存问题
- `getTodayPunchStatus` 使用缓存，缓存键包含日期
- 日期变化时，虽然缓存键会变化，但 `loadData` 没有主动清除缓存
- 可能导致使用旧的缓存数据

## 修复方案

### 修复 1: 使用 `time` 状态替代 `now` 变量

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

**优点**:
- `time` 状态每秒更新，始终是当前时间
- 月份显示会自动更新
- 不需要额外的变量

### 修复 2: 添加日期变化检测

**新增代码**:
```typescript
// 检测日期变化，在新的一天时重新加载数据
useEffect(() => {
  let lastDate = time.toDateString();

  const checkDateChange = () => {
    const currentDate = new Date().toDateString();
    
    // 如果日期发生变化，重新加载数据
    if (currentDate !== lastDate) {
      console.log('检测到日期变化，重新加载打卡数据');
      lastDate = currentDate;
      loadData();
    }
  };

  // 每分钟检查一次日期变化（在午夜时会触发）
  const dateCheckTimer = setInterval(checkDateChange, 60000);
  
  // 组件挂载时也检查一次
  checkDateChange();
  
  return () => clearInterval(dateCheckTimer);
}, [loadData]);
```

**工作原理**:
- 使用闭包保存上一次的日期
- 每分钟检查一次当前日期
- 如果日期变化，调用 `loadData()` 重新加载数据
- 在午夜时会自动触发

### 修复 3: 在 loadData 中清除缓存

**修改前**:
```typescript
const loadData = useCallback(async () => {
  try {
    setIsLoading(true);
    const [recentRecordsData, statsData, statusData, settings] = await Promise.all([
      attendanceService.getRecentRecords(),
      // ...
    ]);
    // ...
  }
}, [onNotify]);
```

**修改后**:
```typescript
const loadData = useCallback(async () => {
  try {
    setIsLoading(true);
    
    // 清除缓存，确保获取最新数据（特别是在日期变化时）
    attendanceService.clearAttendanceCache();
    
    const [recentRecordsData, statsData, statusData, settings] = await Promise.all([
      attendanceService.getRecentRecords(),
      // ...
    ]);
    // ...
  }
}, [onNotify]);
```

**优点**:
- 每次加载数据时都清除缓存
- 确保获取最新的打卡状态
- 特别是在日期变化时，避免使用旧缓存

## 测试场景

### 场景 1: 跨午夜测试
1. 在 23:59 打开打卡页面
2. 等待到 00:00
3. 验证：
   - ✅ 月份显示自动更新
   - ✅ 打卡状态重置（可以重新打上班卡）
   - ✅ 控制台显示"检测到日期变化，重新加载打卡数据"

### 场景 2: 长时间打开页面
1. 早上打开打卡页面并打上班卡
2. 保持页面打开一整天
3. 晚上下班时打下班卡
4. 验证：
   - ✅ 可以正常打下班卡
   - ✅ 统计数据正确

### 场景 3: 缓存清除
1. 打卡后立即刷新页面
2. 验证：
   - ✅ 显示正确的打卡状态
   - ✅ 不会出现"今天已经打过卡"的错误提示

## 性能考虑

### 日期检查频率
- 每分钟检查一次（60000ms）
- 不会对性能造成明显影响
- 在午夜时能及时检测到日期变化

### 缓存策略
- 打卡状态缓存 TTL: 1分钟
- 每次 `loadData` 时清除缓存
- 平衡了性能和数据新鲜度

## 相关文件

- `views/Attendance.tsx` - 主要修复文件
- `src/services/attendanceService.ts` - 缓存管理

## 修复日期
2026年1月14日

## 状态
✅ 已修复并测试

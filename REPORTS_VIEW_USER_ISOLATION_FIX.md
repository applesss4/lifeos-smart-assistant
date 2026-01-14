# 日报管理用户数据隔离修复

## 问题描述

管理端的日报管理页面（ReportsView）在切换用户时没有实现数据隔离，导致无论选择哪个用户，都显示所有用户的日报数据。

## 问题原因

`ReportsView` 组件虽然接收了 `selectedUserId` 属性，但在调用 `dailyReportService.getDailyReports()` 时没有传递该参数，导致查询了所有用户的日报。

## 修复方案

### 修改文件：`admin/src/views/ReportsView.tsx`

#### 修改前：
```typescript
const fetchData = async () => {
    try {
        setIsLoading(true);
        const data = await dailyReportService.getDailyReports();
        setReports(data);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    fetchData();
}, []);
```

#### 修改后：
```typescript
const fetchData = async () => {
    try {
        setIsLoading(true);
        // 传入 selectedUserId 实现数据隔离
        const data = await dailyReportService.getDailyReports(30, 0, selectedUserId);
        setReports(data);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    fetchData();
}, [selectedUserId]); // 添加 selectedUserId 作为依赖，切换用户时重新加载
```

## 修改说明

1. **传递用户ID参数**：在调用 `getDailyReports()` 时传入 `selectedUserId` 参数
   - 参数说明：`getDailyReports(limit, offset, userId)`
   - `limit`: 30 - 每页显示30条记录
   - `offset`: 0 - 从第一条开始
   - `userId`: selectedUserId - 当前选中的用户ID

2. **添加依赖项**：在 `useEffect` 的依赖数组中添加 `selectedUserId`
   - 当 `selectedUserId` 变化时，自动重新加载数据
   - 实现切换用户时的数据刷新

## 功能验证

修复后的功能：
- ✅ 切换用户时，只显示该用户的日报数据
- ✅ 不同用户的日报数据完全隔离
- ✅ 管理员可以查看和管理每个用户的日报
- ✅ 构建成功，无 TypeScript 错误

## 相关服务

`dailyReportService.getDailyReports()` 函数已经支持用户过滤：
```typescript
export async function getDailyReports(
    limit: number = 30, 
    offset: number = 0, 
    userId?: string  // 可选的用户ID参数
): Promise<DailyReport[]>
```

当提供 `userId` 参数时，会在数据库查询中添加 `.eq('user_id', userId)` 条件，实现数据隔离。

## 测试建议

1. 在管理端选择不同的用户
2. 验证日报列表只显示当前选中用户的数据
3. 切换用户后，确认数据自动刷新
4. 验证删除操作只影响当前用户的日报

## 日期

2025-01-14

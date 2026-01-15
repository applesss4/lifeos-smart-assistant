# 打卡管理月份选择器功能

## 功能概述

在管理端的打卡记录管理页面添加月份选择器，允许管理员查看往期月份的打卡记录，方便进行历史数据查询和管理。

## 需求背景

之前的打卡管理页面只能查看最近30天的记录，无法方便地查看更早期的打卡数据。添加月份选择器后，管理员可以：
- 查看任意月份的打卡记录
- 快速切换到上一月/下一月
- 一键回到当前月份
- 选择任意年份和月份

## 实现方案

### 1. UI 设计

#### 月份选择器组件
在标题和操作按钮之间添加一个独立的卡片，包含：

```
┌─────────────────────────────────────────────────────┐
│  📅 查看月份                                         │
│                                                      │
│  [<]  [2025年 ▼]  [1月 ▼]  [>]  [本月]            │
└─────────────────────────────────────────────────────┘
```

**组件元素**：
1. **图标和标签**：日历图标 + "查看月份"文字
2. **上一月按钮**：`<` 箭头，点击切换到上一月
3. **年份下拉框**：显示最近5年，可选择
4. **月份下拉框**：1-12月，可选择
5. **下一月按钮**：`>` 箭头，点击切换到下一月
6. **本月按钮**：快速回到当前月份

### 2. 状态管理

```typescript
// 月份选择器状态
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
```

- `selectedYear`: 当前选中的年份
- `selectedMonth`: 当前选中的月份（1-12）

### 3. 数据加载逻辑

#### 修改前
```typescript
// 只能获取最近N天的记录
const data = await attendanceService.getAttendanceRecords(30, selectedUserId);
```

#### 修改后
```typescript
// 根据选中的年月计算日期范围
const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

// 按日期范围获取记录
const data = await attendanceService.getAttendanceRecordsByDateRange(
    startDate, 
    endDate, 
    selectedUserId
);
```

### 4. 新增服务函数

在 `src/services/attendanceService.ts` 中添加：

```typescript
/**
 * 按日期范围获取打卡记录
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 * @param userId 可选的用户ID,如果提供则只获取该用户的记录
 */
export async function getAttendanceRecordsByDateRange(
    startDate: string, 
    endDate: string, 
    userId?: string
): Promise<AttendanceRecord[]> {
    let query = supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate)
        .lte('record_date', endDate);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
        .order('record_date', { ascending: false })
        .order('record_time', { ascending: false });

    if (error) {
        console.error('按日期范围获取打卡记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToRecord);
}
```

### 5. 交互逻辑

#### 上一月按钮
```typescript
onClick={() => {
    if (selectedMonth === 1) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(12);
    } else {
        setSelectedMonth(selectedMonth - 1);
    }
}}
```

#### 下一月按钮
```typescript
onClick={() => {
    if (selectedMonth === 12) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(1);
    } else {
        setSelectedMonth(selectedMonth + 1);
    }
}}
```

#### 本月按钮
```typescript
onClick={() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
}}
```

### 6. 自动刷新

使用 `useEffect` 监听年月变化，自动重新加载数据：

```typescript
useEffect(() => {
    fetchRecords();
}, [selectedUserId, selectedYear, selectedMonth]);
```

## 技术细节

### 1. 日期计算

#### 月份第一天
```typescript
const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
// 例如：2025-01-01
```

#### 月份最后一天
```typescript
// 使用 Date 构造函数的特性：
// new Date(year, month, 0) 返回上个月的最后一天
const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
// 例如：2025-01-31
```

### 2. 年份选项生成

```typescript
// 生成最近5年的选项
Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
// 例如：[2025, 2024, 2023, 2022, 2021]
```

### 3. 月份选项生成

```typescript
// 生成1-12月的选项
Array.from({ length: 12 }, (_, i) => i + 1)
// 结果：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

### 4. 数据库查询

使用 Supabase 的范围查询：

```typescript
.gte('record_date', startDate)  // 大于等于开始日期
.lte('record_date', endDate)    // 小于等于结束日期
```

## UI 样式

### 卡片样式
- 白色背景（深色模式：`#1c2127`）
- 圆角：`rounded-2xl`
- 边框：`border-gray-100`（深色模式：`border-gray-800`）
- 阴影：`shadow-sm`
- 内边距：`p-4`

### 按钮样式
- **箭头按钮**：圆角 `rounded-lg`，悬停时背景变化
- **下拉框**：灰色背景，边框，圆角 `rounded-lg`
- **本月按钮**：主色调背景 `bg-primary/10`，文字 `text-primary`

### 响应式设计
- 移动端：按钮和下拉框自动调整大小
- 桌面端：所有元素横向排列

## 用户体验

### 优化前
- ❌ 只能查看最近30天的记录
- ❌ 无法查看历史月份数据
- ❌ 需要手动修改代码才能查看更早的记录

### 优化后
- ✅ 可以查看任意月份的记录
- ✅ 快速切换上一月/下一月
- ✅ 一键回到当前月份
- ✅ 直观的年月选择界面
- ✅ 自动加载选中月份的数据

## 使用场景

1. **查看历史记录**：
   - 选择过去的年月
   - 查看员工的历史打卡情况

2. **月度对比**：
   - 切换不同月份
   - 对比不同月份的出勤情况

3. **数据审核**：
   - 查看特定月份的打卡记录
   - 进行考勤审核和工资核算

4. **快速导航**：
   - 使用箭头按钮快速浏览相邻月份
   - 使用"本月"按钮快速回到当前月份

## 文件变更

### 修改的文件

1. **admin/src/views/AttendanceView.tsx**
   - 添加 `selectedYear` 和 `selectedMonth` 状态
   - 修改 `fetchRecords` 函数，使用日期范围查询
   - 添加月份选择器 UI 组件
   - 更新 `useEffect` 依赖项

2. **src/services/attendanceService.ts**
   - 添加 `getAttendanceRecordsByDateRange` 函数
   - 支持按日期范围查询打卡记录

### 相关文件（无需修改）
- `src/utils/dateHelper.ts` - 日期辅助函数
- `supabase/migrations/*` - 数据库表结构

## 测试建议

### 功能测试

1. **基本功能**：
   - 选择不同年份，确认数据正确加载
   - 选择不同月份，确认数据正确加载
   - 点击上一月按钮，确认正确切换
   - 点击下一月按钮，确认正确切换
   - 点击本月按钮，确认回到当前月份

2. **边界测试**：
   - 从1月切换到上一月（应该到上一年12月）
   - 从12月切换到下一月（应该到下一年1月）
   - 选择没有数据的月份（应该显示空状态）
   - 选择未来的月份（应该显示空状态）

3. **数据准确性**：
   - 确认显示的记录都在选中月份内
   - 确认没有遗漏该月份的记录
   - 确认记录按日期倒序排列

4. **用户切换**：
   - 切换用户后，月份选择器保持不变
   - 数据正确过滤为选中用户的记录

### 性能测试
- 切换月份时的加载速度
- 大量数据时的渲染性能
- 频繁切换月份时的响应速度

### UI 测试
- 移动端显示是否正常
- 深色模式是否正常
- 不同屏幕尺寸的适配

## 注意事项

1. **日期计算**：
   - 使用 `padStart(2, '0')` 确保月份格式为两位数
   - 使用 `new Date(year, month, 0)` 获取月份最后一天

2. **性能优化**：
   - 只查询选中月份的数据，减少数据传输
   - 使用 `useEffect` 避免不必要的重新加载

3. **用户体验**：
   - 提供多种切换方式（下拉框、箭头、本月按钮）
   - 保持界面简洁直观

4. **数据一致性**：
   - 确保日期范围计算正确
   - 确保查询条件与UI显示一致

## 预期效果

完成后，管理员可以：
- ✅ 轻松查看任意月份的打卡记录
- ✅ 快速浏览相邻月份的数据
- ✅ 方便地进行历史数据审核
- ✅ 更高效地管理员工考勤

## 扩展建议

未来可以考虑添加：
1. **日期范围选择器**：自定义开始和结束日期
2. **快捷选项**：本周、本月、上月、本季度等
3. **数据统计**：显示选中月份的统计信息
4. **导出功能**：导出选中月份的数据为 CSV
5. **打印功能**：打印选中月份的考勤报表

## 总结

这次修改为打卡管理页面添加了月份选择器功能，大大提升了历史数据的查询便利性。通过直观的UI和灵活的交互方式，管理员可以轻松查看和管理任意月份的打卡记录，为考勤管理和工资核算提供了更好的支持。

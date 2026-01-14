# React Hooks错误修复

**日期**: 2026-01-14
**问题**: Rendered more hooks than during the previous render
**状态**: ✅ 已修复

## 问题描述

在访问Tasks页面时，出现以下React错误：

```
Error: Rendered more hooks than during the previous render.
    at renderTimelineView (Tasks.tsx:165:27)
    at Tasks (Tasks.tsx:268:27)
```

## 根本原因

在 `views/Tasks.tsx` 中，`useMemo` hook被错误地放置在 `renderTimelineView()` 函数内部：

```typescript
// ❌ 错误的做法
const renderTimelineView = () => {
  const timelineTasks = useMemo(() => 
    [...tasks]
      .filter(t => t.date === '今日')
      .sort((a, b) => a.time.localeCompare(b.time)),
    [tasks]
  );
  
  return (
    // JSX...
  );
};
```

这违反了React的**Hooks规则**：
- Hooks必须在组件的顶层调用
- Hooks不能在条件语句、循环或嵌套函数中调用
- 每次渲染时，Hooks的调用顺序必须相同

当 `renderTimelineView()` 被条件性地调用时（例如，根据视图模式），会导致hooks的调用顺序不一致，从而触发错误。

## 解决方案

将 `useMemo` hook移到组件的顶层：

```typescript
// ✅ 正确的做法
const Tasks: React.FC<TasksProps> = ({ onNotify }) => {
  // ... 其他状态和hooks
  
  // 在顶层调用useMemo
  const timelineTasks = useMemo(() => 
    [...tasks]
      .filter(t => t.date === '今日')
      .sort((a, b) => a.time.localeCompare(b.time)),
    [tasks]
  );
  
  const renderTimelineView = () => {
    // 直接使用timelineTasks，不在这里调用hook
    return (
      <div className="space-y-6 pl-4 relative py-4">
        {timelineTasks.map((task) => (
          // JSX...
        ))}
      </div>
    );
  };
  
  // ...
};
```

## 修改内容

### 文件: `views/Tasks.tsx`

**修改前**:
```typescript
const renderTimelineView = () => {
  const timelineTasks = useMemo(() => 
    [...tasks]
      .filter(t => t.date === '今日')
      .sort((a, b) => a.time.localeCompare(b.time)),
    [tasks]
  );

  return (
    // JSX...
  );
};
```

**修改后**:
```typescript
// 在组件顶层定义
const timelineTasks = useMemo(() => 
  [...tasks]
    .filter(t => t.date === '今日')
    .sort((a, b) => a.time.localeCompare(b.time)),
  [tasks]
);

const renderTimelineView = () => {
  return (
    // JSX...
  );
};
```

## 验证

1. ✅ TypeScript编译无错误
2. ✅ 符合React Hooks规则
3. ✅ 性能优化保持不变（useMemo仍然有效）
4. ✅ 功能完整性保持不变

## React Hooks规则回顾

### 规则1: 只在顶层调用Hooks
❌ 不要在循环、条件或嵌套函数中调用Hooks
✅ 在React函数组件的顶层调用Hooks

### 规则2: 只在React函数中调用Hooks
❌ 不要在普通JavaScript函数中调用Hooks
✅ 在React函数组件或自定义Hooks中调用Hooks

### 为什么这些规则很重要？

React依赖于Hooks的调用顺序来正确地保存状态。如果Hooks的调用顺序在不同渲染之间发生变化，React将无法正确地将状态与对应的Hook关联起来。

## 最佳实践

### 1. 将计算逻辑提升到组件顶层

```typescript
// ✅ 好的做法
const MyComponent = () => {
  const [data, setData] = useState([]);
  
  // 在顶层使用useMemo
  const filteredData = useMemo(() => 
    data.filter(item => item.active),
    [data]
  );
  
  const renderList = () => (
    <ul>
      {filteredData.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
  
  return renderList();
};
```

### 2. 如果需要条件性计算，使用条件表达式

```typescript
// ✅ 好的做法
const MyComponent = ({ mode }) => {
  const [data, setData] = useState([]);
  
  // 始终调用useMemo，但内部逻辑可以是条件性的
  const processedData = useMemo(() => {
    if (mode === 'timeline') {
      return data.sort((a, b) => a.time.localeCompare(b.time));
    }
    return data;
  }, [data, mode]);
  
  return <div>{/* 使用processedData */}</div>;
};
```

### 3. 使用ESLint插件检测Hooks错误

安装并配置 `eslint-plugin-react-hooks`：

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## 相关资源

- [React Hooks规则](https://react.dev/reference/rules/rules-of-hooks)
- [useMemo文档](https://react.dev/reference/react/useMemo)
- [ESLint插件](https://www.npmjs.com/package/eslint-plugin-react-hooks)

## 影响范围

- **影响组件**: `views/Tasks.tsx`
- **影响功能**: 任务页面的时间线视图
- **用户影响**: 修复前，切换到时间线视图会导致应用崩溃
- **修复后**: 时间线视图正常工作，无错误

## 测试建议

1. 测试列表视图和时间线视图之间的切换
2. 测试添加新任务
3. 测试完成/取消完成任务
4. 测试在不同视图模式下的任务过滤和排序

---

**修复时间**: 2026-01-14 23:20
**修复者**: Kiro AI
**文档版本**: 1.0

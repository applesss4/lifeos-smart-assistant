# UI Feedback Components

本文档描述了应用中用于用户反馈和加载状态的UI组件。

## 概述

UI反馈组件提供了一套完整的用户界面反馈解决方案，包括加载指示器、消息提示、Toast通知等，确保用户在使用应用时获得清晰的操作反馈。

**实现需求**: 5.4, 5.5, 9.4, 9.5

## 组件列表

### 1. LoadingSpinner - 加载指示器

用于显示加载状态的旋转动画。

```tsx
import { LoadingSpinner } from '../components/UIFeedback';

// 基本用法
<LoadingSpinner />

// 自定义大小和颜色
<LoadingSpinner size="lg" color="primary" />
```

**属性**:
- `size`: 'sm' | 'md' | 'lg' - 指示器大小
- `color`: 'primary' | 'white' | 'gray' - 指示器颜色
- `className`: string - 额外的CSS类名

### 2. FullPageLoading - 全屏加载

用于页面级别的加载状态，覆盖整个屏幕。

```tsx
import { FullPageLoading } from '../components/UIFeedback';

<FullPageLoading message="正在加载数据..." />
```

**属性**:
- `message`: string - 加载提示文本（可选）

### 3. Message - 消息提示

用于显示操作结果的内联消息。

```tsx
import { Message } from '../components/UIFeedback';

<Message 
  type="success" 
  message="操作成功！" 
  onClose={() => setMessage(null)}
/>
```

**属性**:
- `type`: 'success' | 'error' | 'warning' | 'info' - 消息类型
- `message`: string - 消息内容
- `onClose`: () => void - 关闭回调（可选）
- `className`: string - 额外的CSS类名（可选）

**消息类型样式**:
- `success`: 绿色，用于成功操作
- `error`: 红色，用于错误提示
- `warning`: 黄色，用于警告信息
- `info`: 蓝色，用于一般信息

### 4. Toast - Toast通知

用于显示临时的操作反馈，自动消失。

```tsx
import { Toast } from '../components/UIFeedback';

<Toast 
  type="success" 
  message="保存成功！" 
  duration={3000}
  onClose={() => removeToast(id)}
/>
```

**属性**:
- `type`: 'success' | 'error' | 'warning' | 'info' - 通知类型
- `message`: string - 通知内容
- `duration`: number - 显示时长（毫秒），0表示不自动关闭
- `onClose`: () => void - 关闭回调

### 5. ButtonLoading - 按钮加载状态

用于按钮内的加载指示。

```tsx
import { ButtonLoading } from '../components/UIFeedback';

<button disabled={loading}>
  <ButtonLoading loading={loading} loadingText="提交中...">
    提交
  </ButtonLoading>
</button>
```

**属性**:
- `loading`: boolean - 是否显示加载状态
- `loadingText`: string - 加载时显示的文本（可选）
- `children`: ReactNode - 正常状态下显示的内容

### 6. EmptyState - 空状态

用于显示无数据状态。

```tsx
import { EmptyState } from '../components/UIFeedback';

<EmptyState 
  icon="inbox"
  title="暂无数据"
  description="您还没有添加任何内容"
  action={{
    label: "添加第一条",
    onClick: () => handleAdd()
  }}
/>
```

**属性**:
- `icon`: string - Material Icons图标名称（可选）
- `title`: string - 标题
- `description`: string - 描述文本（可选）
- `action`: { label: string, onClick: () => void } - 操作按钮（可选）

### 7. Skeleton - 骨架屏

用于内容加载时的占位。

```tsx
import { Skeleton } from '../components/UIFeedback';

<Skeleton variant="text" width="100%" height="1rem" />
<Skeleton variant="circular" width="40px" height="40px" />
<Skeleton variant="rectangular" width="100%" height="200px" />
```

**属性**:
- `variant`: 'text' | 'circular' | 'rectangular' - 骨架屏类型
- `width`: string - 宽度（可选）
- `height`: string - 高度（可选）
- `className`: string - 额外的CSS类名（可选）

## Toast管理Hook

### useToast

用于管理Toast通知的Hook。

```tsx
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';

function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast();

  const handleSuccess = () => {
    success('操作成功！');
  };

  const handleError = () => {
    error('操作失败，请重试');
  };

  return (
    <>
      <button onClick={handleSuccess}>成功</button>
      <button onClick={handleError}>错误</button>
      
      {/* 在组件顶层渲染Toast容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
```

**返回值**:
- `toasts`: ToastItem[] - 当前所有Toast列表
- `showToast`: (type, message, duration?) => string - 显示Toast，返回ID
- `removeToast`: (id: string) => void - 移除指定Toast
- `success`: (message, duration?) => string - 显示成功Toast
- `error`: (message, duration?) => string - 显示错误Toast
- `warning`: (message, duration?) => string - 显示警告Toast
- `info`: (message, duration?) => string - 显示信息Toast
- `clearAll`: () => void - 清除所有Toast

## 使用示例

### 登录表单中的加载和反馈

```tsx
import { useState } from 'react';
import { Message, ButtonLoading } from '../components/UIFeedback';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await login();
      setSuccess('登录成功！');
    } catch (err) {
      setError('登录失败，请检查您的凭据');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Message type="error" message={error} onClose={() => setError(null)} />}
      {success && <Message type="success" message={success} />}
      
      <input type="email" placeholder="邮箱" />
      <input type="password" placeholder="密码" />
      
      <button type="submit" disabled={loading}>
        <ButtonLoading loading={loading} loadingText="登录中...">
          登录
        </ButtonLoading>
      </button>
    </form>
  );
}
```

### 数据列表加载状态

```tsx
import { useState, useEffect } from 'react';
import { LoadingSpinner, EmptyState, Skeleton } from '../components/UIFeedback';

function DataList() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton variant="rectangular" height="100px" className="mb-4" />
        <Skeleton variant="rectangular" height="100px" className="mb-4" />
        <Skeleton variant="rectangular" height="100px" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState 
        title="暂无数据"
        description="还没有任何记录"
        action={{
          label: "添加第一条",
          onClick: () => handleAdd()
        }}
      />
    );
  }

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### 全局Toast通知

```tsx
// App.tsx
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';

function App() {
  const toast = useToast();

  return (
    <div>
      {/* 应用内容 */}
      <YourComponents toast={toast} />
      
      {/* Toast容器 - 放在应用顶层 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

// 在子组件中使用
function ChildComponent({ toast }) {
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('保存成功！');
    } catch (err) {
      toast.error('保存失败，请重试');
    }
  };

  return <button onClick={handleSave}>保存</button>;
}
```

## 响应式设计

所有UI反馈组件都支持响应式设计：

- **移动设备**: 自动调整大小和间距，确保触摸友好
- **平板设备**: 优化布局和字体大小
- **桌面设备**: 完整的视觉效果和交互

## 可访问性

所有组件都遵循可访问性最佳实践：

- 使用语义化的HTML元素
- 提供适当的ARIA标签
- 支持键盘导航
- 确保足够的颜色对比度
- 提供屏幕阅读器友好的文本

## 动画

组件使用CSS动画提供流畅的用户体验：

- `animate-spin`: 旋转动画（加载指示器）
- `animate-pulse`: 脉冲动画（骨架屏）
- `animate-slide-in-right`: 从右侧滑入（Toast）
- `animate-fade-in`: 淡入
- `animate-scale-in`: 缩放淡入

所有动画都在 `index.css` 中定义。

## 最佳实践

1. **一致性**: 在整个应用中使用相同的反馈组件
2. **及时性**: 立即显示加载状态，不要让用户等待
3. **清晰性**: 使用明确的消息文本，避免技术术语
4. **适度性**: 不要过度使用动画和通知
5. **可关闭**: 允许用户关闭持久性消息
6. **自动消失**: Toast通知应该自动消失（3-5秒）
7. **错误处理**: 始终为错误提供清晰的反馈和解决建议

## 相关文件

- `src/components/UIFeedback.tsx` - UI反馈组件
- `src/components/ToastContainer.tsx` - Toast容器组件
- `src/hooks/useToast.ts` - Toast管理Hook
- `index.css` - 全局样式和动画

# 通知显示优化

## 问题描述
前端用户收到的月度报告通知内容较长，但被 `line-clamp-3` 限制只显示3行，导致用户无法看到完整的报告内容。

## 解决方案

### 1. 添加展开/收起功能
- 为每条通知添加展开状态管理
- 使用 `Set<string>` 存储已展开的通知 ID
- 当内容超过 150 字符时显示"展开全文"按钮

### 2. 改进内容显示
- 使用 `whitespace-pre-wrap` 保留换行格式
- 展开时显示完整内容
- 收起时显示前3行（`line-clamp-3`）

### 3. 用户体验优化
- 点击"展开全文"按钮查看完整内容
- 点击"收起"按钮折叠内容
- 按钮样式与其他操作按钮保持一致

## 实现细节

### 状态管理
```typescript
const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
```

### 展开/收起逻辑
```typescript
const isExpanded = expandedNotifications.has(notification.id);
const isLongContent = notification.content.length > 150;

// 切换展开状态
const toggleExpand = () => {
  const newExpanded = new Set(expandedNotifications);
  if (isExpanded) {
    newExpanded.delete(notification.id);
  } else {
    newExpanded.add(notification.id);
  }
  setExpandedNotifications(newExpanded);
};
```

### 条件渲染
```typescript
<p className={`text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap ${
  !isExpanded && isLongContent ? 'line-clamp-3' : ''
}`}>
  {notification.content}
</p>
{isLongContent && (
  <button onClick={toggleExpand} className="text-[10px] font-bold text-primary">
    {isExpanded ? '收起' : '展开全文'}
  </button>
)}
```

## 效果

### 优化前
- 所有通知内容都被限制为3行
- 长内容（如月度报告）无法完整查看
- 用户体验不佳

### 优化后
- 短内容（≤150字符）：直接显示完整内容
- 长内容（>150字符）：
  - 默认显示前3行
  - 显示"展开全文"按钮
  - 点击后显示完整内容
  - 可以点击"收起"折叠回去
- 保留换行格式，月度报告更易读

## 适用场景

这个优化特别适合以下类型的通知：
1. **月度报告**：包含多行数据和摘要
2. **日报总结**：包含详细的工作记录
3. **自定义消息**：管理员发送的长文本通知

## 技术栈
- React Hooks (useState)
- TypeScript
- Tailwind CSS (line-clamp-3, whitespace-pre-wrap)

## 文件变更
- `views/Home.tsx`: 添加展开/收起功能

## 测试建议
1. 发送短消息（<150字符）：应直接显示完整内容，无展开按钮
2. 发送长消息（>150字符）：应显示展开按钮
3. 点击展开：应显示完整内容和收起按钮
4. 点击收起：应折叠回3行显示
5. 测试多条通知：每条通知的展开状态应独立管理
6. 测试换行格式：月度报告的换行应正确显示

## 后续优化建议
1. 添加滚动到顶部功能（展开长内容后）
2. 支持富文本格式（加粗、颜色等）
3. 添加复制内容功能
4. 支持分享通知内容

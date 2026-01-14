# 通知系统实现计划

## 概述

将前端的"今日日报总结"按钮改造为通用的消息通知系统，允许管理端向用户发送日报、月报等消息。

## 功能需求

### 1. 前端用户端
- ✅ 将"今日日报总结"按钮改为"消息通知"按钮
- ✅ 显示未读消息数量徽章
- ✅ 点击查看消息列表
- ✅ 查看消息后自动标记为已读
- ✅ 支持删除消息
- ✅ 实时接收新消息通知

### 2. 管理端
- 在日报管理页面添加"分享"按钮
- 在月度报告页面添加"分享"按钮
- 选择目标用户并发送
- 发送成功提示

### 3. 今日日报总结功能
- 移动到"工作模式"文本位置
- 保持原有功能不变

## 数据库设计

### user_notifications 表

```sql
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- 接收用户
    sender_id UUID,                     -- 发送者（管理员）
    title TEXT NOT NULL,                -- 标题
    content TEXT NOT NULL,              -- 内容
    type TEXT NOT NULL,                 -- 类型：daily_report, monthly_report, custom
    reference_id TEXT,                  -- 关联的日报或月报ID
    is_read BOOLEAN DEFAULT FALSE,      -- 是否已读
    created_at TIMESTAMP,               -- 创建时间
    read_at TIMESTAMP                   -- 阅读时间
);
```

## 已完成的工作

### 1. 数据库迁移 ✅
- 文件：`supabase/migrations/add_user_notifications.sql`
- 创建了 `user_notifications` 表
- 配置了 RLS 策略
- 添加了索引

### 2. 通知服务 ✅
- 文件：`src/services/notificationService.ts`
- 实现了完整的 CRUD 操作
- 支持实时订阅
- 类型安全

### 3. 通知 Hook ✅
- 文件：`src/hooks/useNotifications.ts`
- 封装了通知逻辑
- 自动加载和实时更新
- 提供便捷的操作方法

## 待实现的工作

### 1. 前端用户端修改

#### 1.1 修改 Home.tsx
- [ ] 导入 `useNotifications` Hook
- [ ] 将 `showDailyReport` 状态改为 `showNotifications`
- [ ] 修改按钮图标和文本
- [ ] 添加未读数量徽章
- [ ] 创建通知列表 UI
- [ ] 实现查看、标记已读、删除功能

#### 1.2 移动"今日日报总结"功能
- [ ] 在"工作模式"区域添加"生成日报"按钮
- [ ] 保持原有的日报生成逻辑
- [ ] 更新 UI 样式

### 2. 管理端发送功能

#### 2.1 修改 ReportsView.tsx（日报管理）
- [ ] 在每个日报卡片添加"分享"按钮
- [ ] 创建用户选择弹窗
- [ ] 实现发送逻辑
- [ ] 发送成功提示

#### 2.2 修改 MonthlyReportView.tsx（月度报告）
- [ ] 在报告头部添加"分享"按钮
- [ ] 创建用户选择弹窗
- [ ] 实现发送逻辑
- [ ] 发送成功提示

#### 2.3 创建用户选择组件
- [ ] 文件：`admin/src/components/UserSelector.tsx`
- [ ] 获取所有用户列表
- [ ] 支持搜索和选择
- [ ] 美观的 UI

### 3. 通知内容格式

#### 日报通知
```typescript
{
    title: "📊 今日工作日报",
    content: `
        工作时长：8.5小时
        完成任务：5个
        总支出：¥1,200
        
        ${narrative}
    `,
    type: "daily_report",
    referenceId: reportId
}
```

#### 月报通知
```typescript
{
    title: "📈 月度综合报告",
    content: `
        ${year}年${month}月工作总结
        
        预估工资：¥${salary}
        总工时：${hours}小时
        任务完成率：${rate}%
        
        查看完整报告了解更多详情。
    `,
    type: "monthly_report",
    referenceId: `${year}-${month}`
}
```

## UI 设计

### 前端通知按钮
```
┌─────────────────────────┐
│  [🔔]  ← 铃铛图标        │
│   (3)  ← 未读数量徽章    │
└─────────────────────────┘
```

### 通知列表
```
┌──────────────────────────────────┐
│  消息通知                    [×]  │
├──────────────────────────────────┤
│  📊 今日工作日报          [新]   │
│  2025-01-14 15:30               │
│  工作时长：8.5小时...            │
│  ────────────────────────────   │
│  📈 月度综合报告                 │
│  2025-01-14 10:00               │
│  2025年1月工作总结...            │
│  ────────────────────────────   │
│  [标记全部已读]                  │
└──────────────────────────────────┘
```

### 管理端分享按钮
```
┌──────────────────────────────────┐
│  日报卡片                        │
│  ┌────────────────────────────┐ │
│  │  2025-01-14                │ │
│  │  工作时长：8.5h            │ │
│  │  [删除] [分享]  ← 新增     │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

## 实现步骤

### 第一阶段：基础功能（当前）
1. ✅ 创建数据库表
2. ✅ 实现通知服务
3. ✅ 创建通知 Hook

### 第二阶段：前端用户端
1. 修改 Home.tsx 的通知按钮
2. 创建通知列表 UI
3. 移动日报总结功能
4. 测试功能

### 第三阶段：管理端发送
1. 创建用户选择组件
2. 修改日报管理页面
3. 修改月度报告页面
4. 测试发送功能

### 第四阶段：优化和测试
1. 实时通知测试
2. 性能优化
3. UI/UX 优化
4. 错误处理完善

## 技术要点

### 1. 实时通知
使用 Supabase Realtime 订阅：
```typescript
supabase
    .channel('user_notifications')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
```

### 2. 未读数量徽章
```tsx
{unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 99 ? '99+' : unreadCount}
    </span>
)}
```

### 3. 自动标记已读
用户点击查看通知时自动调用 `markAsRead()`

### 4. 权限控制
- 普通用户只能查看自己的通知
- 管理员可以创建通知
- 使用 RLS 策略保证安全

## 测试计划

### 功能测试
- [ ] 用户接收通知
- [ ] 未读数量显示
- [ ] 标记已读功能
- [ ] 删除通知功能
- [ ] 实时更新
- [ ] 管理员发送功能

### 边界测试
- [ ] 无通知时的显示
- [ ] 大量通知的性能
- [ ] 网络断开重连
- [ ] 并发操作

### 兼容性测试
- [ ] 移动端显示
- [ ] 深色模式
- [ ] 不同浏览器

## 注意事项

1. **数据迁移**：需要运行 SQL 迁移脚本
2. **权限检查**：确保 RLS 策略正确配置
3. **性能考虑**：通知列表需要分页加载
4. **用户体验**：通知应该简洁明了
5. **错误处理**：网络错误时的友好提示

## 下一步行动

1. 运行数据库迁移
2. 实现前端通知 UI
3. 实现管理端发送功能
4. 全面测试

## 相关文件

### 新增文件
- `supabase/migrations/add_user_notifications.sql`
- `src/services/notificationService.ts`
- `src/hooks/useNotifications.ts`
- `admin/src/components/UserSelector.tsx` (待创建)

### 需要修改的文件
- `views/Home.tsx`
- `admin/src/views/ReportsView.tsx`
- `admin/src/views/MonthlyReportView.tsx`

## 预期效果

完成后，系统将具备：
1. 完整的消息通知功能
2. 管理员可以向用户发送日报和月报
3. 用户可以实时接收和查看消息
4. 清晰的未读提示
5. 良好的用户体验

# 通知删除功能修复

## 问题描述

用户在前端删除通知后，刷新页面通知又重新出现，无法真正删除。

## 问题原因

数据库的 RLS（Row Level Security）策略中**缺少 DELETE 权限**。

原有的 `user_notifications` 表只配置了以下策略：
- ✅ SELECT：用户可以查看自己的通知
- ✅ UPDATE：用户可以更新自己的通知（标记已读）
- ✅ INSERT：管理员可以创建通知
- ❌ DELETE：**缺少删除策略**

因此，当用户调用 `deleteNotification()` 函数时：
1. 前端代码执行成功（从本地状态中移除）
2. 数据库删除操作被 RLS 策略拒绝（静默失败）
3. 刷新页面后，数据库中的通知仍然存在，重新加载显示

## 解决方案

### 1. 创建数据库迁移文件

文件：`supabase/migrations/fix_notification_delete_policy.sql`

```sql
-- 添加用户删除自己通知的策略
CREATE POLICY "Users can delete their own notifications"
    ON user_notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 添加管理员删除所有通知的策略（可选）
CREATE POLICY "Admins can delete all notifications"
    ON user_notifications
    FOR DELETE
    USING (
        public.is_admin(auth.uid())
    );
```

### 2. 应用迁移

在 Supabase Dashboard 中执行以下步骤：

1. 打开 Supabase 项目控制台
2. 进入 **SQL Editor**
3. 创建新查询
4. 复制并粘贴 `fix_notification_delete_policy.sql` 的内容
5. 点击 **Run** 执行

或者使用 Supabase CLI：

```bash
# 如果使用本地开发环境
supabase db push

# 或者直接应用迁移
supabase migration up
```

### 3. 验证修复

执行以下 SQL 查询验证策略是否创建成功：

```sql
-- 查看 user_notifications 表的所有策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_notifications'
ORDER BY cmd, policyname;
```

应该看到以下策略：
- `Users can view their own notifications` (SELECT)
- `Users can update their own notifications` (UPDATE)
- `Users can delete their own notifications` (DELETE) ← **新增**
- `Admins can create notifications` (INSERT)
- `Admins can view all notifications` (SELECT)
- `Admins can delete all notifications` (DELETE) ← **新增**

## 测试步骤

1. **删除通知**：
   - 登录前端用户账号
   - 打开通知列表
   - 点击某条通知的"删除"按钮
   - 确认删除

2. **验证删除**：
   - 通知应立即从列表中消失
   - 刷新页面（F5）
   - 确认通知不再出现 ✅

3. **测试权限隔离**：
   - 用户 A 不能删除用户 B 的通知
   - 管理员可以删除任何通知

## 技术细节

### RLS 策略说明

```sql
CREATE POLICY "Users can delete their own notifications"
    ON user_notifications
    FOR DELETE
    USING (auth.uid() = user_id);
```

- `FOR DELETE`：指定策略适用于删除操作
- `USING (auth.uid() = user_id)`：只允许删除 `user_id` 等于当前登录用户 ID 的记录
- 这确保了用户只能删除自己的通知，无法删除他人的通知

### 前端代码（无需修改）

前端的删除逻辑已经正确实现：

```typescript
// src/services/notificationService.ts
export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('删除通知失败:', error.message);
        throw error;
    }
}

// src/hooks/useNotifications.ts
const deleteNotification = useCallback(async (notificationId: string) => {
    try {
        await notificationService.deleteNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // 如果删除的是未读通知，更新未读数量
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    } catch (error) {
        console.error('删除通知失败:', error);
        throw error;
    }
}, [notifications]);
```

一旦 RLS 策略添加后，这些代码就能正常工作。

## 相关文件

### 新增文件
- `supabase/migrations/fix_notification_delete_policy.sql` - 修复删除权限的迁移文件

### 相关文件（无需修改）
- `supabase/migrations/add_user_notifications.sql` - 原始通知表创建文件
- `src/services/notificationService.ts` - 通知服务
- `src/hooks/useNotifications.ts` - 通知 Hook
- `views/Home.tsx` - 前端通知 UI

## 注意事项

1. **数据库迁移**：必须在 Supabase 中执行迁移脚本
2. **权限验证**：确保 `public.is_admin()` 函数存在且正常工作
3. **测试覆盖**：测试普通用户和管理员的删除权限
4. **错误处理**：前端已有错误处理，删除失败会显示提示

## 预期效果

修复后：
- ✅ 用户可以删除自己的通知
- ✅ 删除后刷新页面，通知不再出现
- ✅ 用户无法删除他人的通知
- ✅ 管理员可以删除任何通知
- ✅ 删除操作有错误提示

## 总结

这是一个典型的 RLS 策略配置不完整导致的问题。前端代码逻辑正确，但数据库层面缺少必要的权限策略。通过添加 DELETE 策略，问题得到彻底解决。

**关键教训**：在使用 Supabase RLS 时，必须为每种操作（SELECT、INSERT、UPDATE、DELETE）都配置相应的策略，否则该操作会被默认拒绝。

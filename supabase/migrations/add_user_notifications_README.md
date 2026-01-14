# 用户通知表迁移说明

## 文件
`add_user_notifications.sql`

## 修复说明

### 问题
原始脚本中使用了错误的列名：
- ❌ `user_profiles.user_id` (不存在)
- ❌ `user_profiles.is_admin` (不存在)

### 解决方案
使用正确的权限检查方式：
- ✅ 使用 `public.is_admin(auth.uid())` 函数
- ✅ 该函数检查 `user_roles` 表中的管理员角色

## 表结构

### user_notifications
```sql
- id: UUID (主键)
- user_id: UUID (接收用户)
- sender_id: UUID (发送者)
- title: TEXT (标题)
- content: TEXT (内容)
- type: TEXT (类型: daily_report, monthly_report, custom)
- reference_id: TEXT (关联ID)
- is_read: BOOLEAN (是否已读)
- created_at: TIMESTAMP (创建时间)
- read_at: TIMESTAMP (阅读时间)
```

## RLS 策略

1. **用户查看自己的通知**
   - 用户只能看到 `user_id` 等于自己的通知

2. **用户更新自己的通知**
   - 用户只能更新自己的通知（标记为已读）

3. **管理员创建通知**
   - 只有管理员可以创建通知
   - 使用 `is_admin()` 函数验证

4. **管理员查看所有通知**
   - 管理员可以查看所有用户的通知

## 运行迁移

```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
# 或使用 Supabase CLI
supabase db push
```

## 验证

运行迁移后，检查：
1. 表是否创建成功
2. 索引是否创建
3. RLS 策略是否生效
4. 权限是否正确

```sql
-- 检查表
SELECT * FROM user_notifications LIMIT 1;

-- 检查策略
SELECT * FROM pg_policies WHERE tablename = 'user_notifications';
```

## 依赖

此迁移依赖于：
- `auth.users` 表（Supabase 内置）
- `user_roles` 表
- `is_admin()` 函数

确保这些已经存在于数据库中。

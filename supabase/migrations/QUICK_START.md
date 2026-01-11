# 快速开始 - 应用 RLS 迁移

## 最简单的方法

### 步骤 1: 备份数据库

在 Supabase Dashboard:
- Database → Backups → Create backup

### 步骤 2: 应用迁移 006

1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `006_user_profiles_and_rls.sql` 的全部内容
3. 粘贴并点击 **Run**

**预期结果**: 
```
Success. No rows returned
```

**如果遇到错误**: 迁移文件是幂等的，可以安全地重新运行。

### 步骤 3: 验证迁移 006

运行以下查询：

```sql
-- 应该看到 profiles 和 user_roles 表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles');
```

### 步骤 4: 测试用户注册

1. 在你的应用中注册一个新用户
2. 运行以下查询验证自动创建：

```sql
-- 应该看到新用户的配置文件
SELECT * FROM profiles;

-- 应该看到新用户的默认角色
SELECT * FROM user_roles;
```

### 步骤 5: 应用迁移 007

1. 在 SQL Editor 中创建新查询
2. 复制 `007_existing_tables_rls.sql` 的全部内容
3. 粘贴并点击 **Run**

**⚠️ 警告**: 这会删除所有公开访问策略！

### 步骤 6: 验证迁移 007

```sql
-- 检查 RLS 是否启用（应该都是 true）
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 检查策略数量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

预期结果：
- tasks: 7 个策略
- attendance_records: 7 个策略
- transactions: 7 个策略
- daily_reports: 7 个策略
- salary_settings: 7 个策略
- profiles: 4 个策略
- user_roles: 4 个策略

## 完成！

现在你的数据库已经实现了完整的用户数据隔离。

## 下一步

1. **更新应用代码**: 确保所有数据操作使用 `auth.uid()`
2. **测试数据隔离**: 创建多个用户并验证数据隔离
3. **创建管理员**: 为需要的用户添加管理员角色

```sql
-- 添加管理员角色
INSERT INTO user_roles (user_id, role) 
VALUES ('your-admin-user-id', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## 需要帮助？

查看详细文档：
- `README.md` - 完整的迁移文档
- `apply-migrations.md` - 详细的应用指南
- `IMPLEMENTATION_SUMMARY.md` - 技术实现细节

## 回滚（仅用于紧急情况）

如果需要回滚到公开访问模式：

```sql
-- 警告：这会移除所有数据保护！
-- 为每个表创建公开访问策略
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public access" ON %I', tbl);
        EXECUTE format('CREATE POLICY "Allow public access" ON %I FOR ALL USING (true)', tbl);
    END LOOP;
END $$;
```

然后在应用代码中移除认证检查。

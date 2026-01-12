# 修复 Daily Reports 表结构

## 问题
应用代码尝试向 `daily_reports` 表插入数据时出错，因为表中缺少以下字段：
- `biggest_expense_amount`
- `biggest_expense_name`
- `completed_tasks_count`
- `pending_tasks_count`
- `completed_tasks_titles`
- `pending_tasks_titles`
- `expense_count`
- `narrative`

并且一些字段名称不匹配。

## 解决方案

### 方法 1: 使用 Supabase Dashboard（推荐）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 进入 SQL Editor
4. 复制并执行 `supabase/migrations/update_daily_reports_schema.sql` 文件中的 SQL

### 方法 2: 使用 psql 命令行

如果你有数据库的直接访问权限：

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.rfdyxocmrpofkrwdsipz.supabase.co:5432/postgres" -f supabase/migrations/update_daily_reports_schema.sql
```

## 验证

执行迁移后，在 SQL Editor 中运行以下查询来验证表结构：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_reports'
ORDER BY ordinal_position;
```

应该看到所有必需的字段。

## 刷新 Schema Cache

执行迁移后，需要刷新 Supabase 的 schema cache：

1. 在 Supabase Dashboard 中
2. 进入 Settings > API
3. 点击 "Reload schema cache" 按钮

或者等待几分钟让缓存自动刷新。

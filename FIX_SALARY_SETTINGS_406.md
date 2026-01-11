# 修复 Salary Settings 406 错误

## 问题描述
管理员查询 `salary_settings` 表时收到 406 (Not Acceptable) 错误，说明 RLS 策略配置有问题。

## 错误信息
```
GET .../rest/v1/salary_settings?select=*&user_id=eq.xxx&limit=1 406 (Not Acceptable)
工资设置表不可用或未找到记录，使用默认值
```

## 原因分析
`salary_settings` 表缺少管理员的 INSERT 策略，或者现有的 RLS 策略配置不正确。

## 🚀 快速修复步骤

### 方案 1：执行修复迁移（推荐）

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 复制 supabase/migrations/fix_salary_settings_rls.sql 的全部内容
-- 粘贴到 SQL Editor 并执行
```

### 方案 2：手动修复

#### 步骤 1：检查表是否启用 RLS
```sql
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;
```

#### 步骤 2：删除所有现有策略
```sql
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can view all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can insert all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can update all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can delete all salary_settings" ON salary_settings;
```

#### 步骤 3：创建用户策略
```sql
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);
```

#### 步骤 4：创建管理员策略
```sql
CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all salary_settings" ON salary_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all salary_settings" ON salary_settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

## ✅ 验证修复

### 1. 检查策略是否创建成功
```sql
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'salary_settings'
ORDER BY policyname;
```

应该看到 8 个策略：
- ✅ Admins can delete all salary_settings (DELETE)
- ✅ Admins can insert all salary_settings (INSERT)
- ✅ Admins can update all salary_settings (UPDATE)
- ✅ Admins can view all salary_settings (SELECT)
- ✅ Users can create own salary_settings (INSERT)
- ✅ Users can delete own salary_settings (DELETE)
- ✅ Users can update own salary_settings (UPDATE)
- ✅ Users can view own salary_settings (SELECT)

### 2. 测试管理员查询
在浏览器控制台中，刷新页面并检查：
- ✅ 不再出现 406 错误
- ✅ 可以成功加载工资设置数据
- ✅ 可以为选中的用户保存工资设置

### 3. 测试管理员创建
```typescript
// 在管理员后端中测试
import * as salaryService from '../../../src/services/salaryService';

const settings = await salaryService.updateSalarySettings({
  hourly_rate: 105,
  overtime_rate: 150,
  transport_fee: 500,
  bonus: 2000,
  xiaowang_diff: 0,
  xiaowang_pension: 0
}, selectedUserId);

console.log('工资设置保存成功:', settings);
```

## 🔍 故障排查

### 问题：仍然出现 406 错误

**检查 1：确认用户是管理员**
```sql
SELECT * FROM user_roles WHERE user_id = 'YOUR_ADMIN_USER_ID';
```

**检查 2：确认策略已创建**
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'salary_settings';
```
应该返回 8

**检查 3：检查 RLS 是否启用**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'salary_settings';
```
`rowsecurity` 应该为 `true`

### 问题：普通用户无法查看自己的工资设置

**检查用户策略：**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'salary_settings' 
AND policyname LIKE 'Users%';
```

应该看到 4 个用户策略

## 📝 注意事项

1. **执行顺序：** 必须先删除旧策略，再创建新策略
2. **权限验证：** RLS 策略会自动验证权限
3. **缓存问题：** 修复后可能需要刷新浏览器
4. **测试环境：** 建议先在测试环境验证

## 🎉 完成

修复完成后：
- ✅ 管理员可以查看所有用户的工资设置
- ✅ 管理员可以为任何用户创建/更新工资设置
- ✅ 普通用户只能查看和修改自己的工资设置
- ✅ 不再出现 406 错误

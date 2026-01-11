-- 修复 salary_settings 表的 RLS 策略
-- 确保管理员可以查看和操作所有用户的工资设置

-- 1. 检查表是否启用了 RLS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略，重新创建
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can view all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can insert all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can update all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can delete all salary_settings" ON salary_settings;

-- 3. 创建用户策略（用户只能操作自己的数据）
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. 创建管理员策略（管理员可以操作所有用户的数据）
CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert all salary_settings" ON salary_settings
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all salary_settings" ON salary_settings
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all salary_settings" ON salary_settings
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- 5. 验证策略
-- 查看所有 salary_settings 的策略
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
WHERE tablename = 'salary_settings'
ORDER BY policyname;

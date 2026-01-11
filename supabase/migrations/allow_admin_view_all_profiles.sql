-- ============================================
-- 允许管理员查看所有用户的资料
-- ============================================

-- 删除旧的查看策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 创建新的查看策略:用户可以查看自己的资料,管理员可以查看所有资料
CREATE POLICY "Users can view own profile or admins can view all" ON profiles
  FOR SELECT 
  USING (
    -- 用户可以查看自己的资料
    auth.uid() = id
    OR
    -- 或者用户是管理员,可以查看所有资料
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 完成！管理员现在可以查看所有用户资料
-- ============================================

-- ============================================
-- 修复 salary_settings 表的 INSERT 策略
-- 问题：INSERT 策略的 qual 为 null
-- ============================================

-- 删除有问题的 INSERT 策略
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;

-- 重新创建正确的 INSERT 策略（带 WITH CHECK）
CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 验证策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'salary_settings' AND cmd = 'INSERT';

-- 显示结果
SELECT '✅ INSERT 策略已修复！' as status;

-- 验证管理员权限配置
-- 这个脚本会检查所有必要的 RLS 策略是否正确配置

-- ============================================
-- 1. 检查当前用户是否为管理员
-- ============================================
SELECT 
  'Current User Admin Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    THEN '✅ 当前用户是管理员'
    ELSE '❌ 当前用户不是管理员'
  END as result;

-- ============================================
-- 2. 检查所有表的策略数量
-- ============================================
SELECT 
  'Policy Count Check' as check_type,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ 正确'
    ELSE '❌ 策略数量不正确（应该是8个）'
  END as status
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 3. 检查管理员 INSERT 策略
-- ============================================
SELECT 
  'Admin INSERT Policy Check' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%Admins can insert%' THEN '✅ 存在'
    ELSE '❌ 缺失'
  END as status
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
  AND cmd = 'INSERT'
  AND policyname LIKE '%Admins%'
ORDER BY tablename;

-- ============================================
-- 4. 检查管理员 SELECT 策略
-- ============================================
SELECT 
  'Admin SELECT Policy Check' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%Admins can view%' THEN '✅ 存在'
    ELSE '❌ 缺失'
  END as status
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
  AND cmd = 'SELECT'
  AND policyname LIKE '%Admins%'
ORDER BY tablename;

-- ============================================
-- 5. 检查管理员 UPDATE 策略
-- ============================================
SELECT 
  'Admin UPDATE Policy Check' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%Admins can update%' THEN '✅ 存在'
    ELSE '❌ 缺失'
  END as status
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
  AND cmd = 'UPDATE'
  AND policyname LIKE '%Admins%'
ORDER BY tablename;

-- ============================================
-- 6. 检查管理员 DELETE 策略
-- ============================================
SELECT 
  'Admin DELETE Policy Check' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%Admins can delete%' THEN '✅ 存在'
    ELSE '❌ 缺失'
  END as status
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
  AND cmd = 'DELETE'
  AND policyname LIKE '%Admins%'
ORDER BY tablename;

-- ============================================
-- 7. 检查 RLS 是否启用
-- ============================================
SELECT 
  'RLS Enabled Check' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS 已启用'
    ELSE '❌ RLS 未启用'
  END as status
FROM pg_tables
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
ORDER BY tablename;

-- ============================================
-- 8. 汇总报告
-- ============================================
SELECT 
  'Summary Report' as report_type,
  COUNT(DISTINCT tablename) as total_tables,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN policyname LIKE '%Admins%' THEN 1 END) as admin_policies,
  COUNT(CASE WHEN policyname LIKE '%Users%' THEN 1 END) as user_policies
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings');

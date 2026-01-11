-- ============================================
-- 完整创建 salary_settings 表
-- 包含所有必要的设置
-- ============================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS salary_settings CASCADE;

-- 2. 创建 salary_settings 表
CREATE TABLE salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 105.00,
    overtime_rate DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    transport_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
    xiaowang_diff DECIMAL(10, 2) DEFAULT 0,
    xiaowang_pension DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 创建触发器（确保函数存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_salary_settings_updated_at ON salary_settings;
CREATE TRIGGER update_salary_settings_updated_at
    BEFORE UPDATE ON salary_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建索引
CREATE INDEX idx_salary_settings_user_id ON salary_settings(user_id);

-- 5. 启用 RLS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

-- 6. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can view all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can update all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can delete all salary_settings" ON salary_settings;

-- 7. 创建用户策略
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 8. 创建管理员策略
CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT USING (
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

-- 9. 验证创建
SELECT 'salary_settings 表创建成功！' as status;

-- 10. 显示表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'salary_settings'
ORDER BY ordinal_position;

-- ============================================
-- 添加 salary_settings 表（如果不存在）
-- ============================================

-- 创建 salary_settings 表
CREATE TABLE IF NOT EXISTS salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 创建触发器（如果函数存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_salary_settings_updated_at ON salary_settings;
        CREATE TRIGGER update_salary_settings_updated_at
            BEFORE UPDATE ON salary_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_salary_settings_user_id ON salary_settings(user_id);

-- 启用 RLS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;

-- 创建新策略
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 完成

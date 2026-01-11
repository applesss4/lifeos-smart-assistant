-- ============================================
-- 1. Create Salary Settings Table (salary_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(), -- Simplified, not using real auth
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 105.00,
    overtime_rate DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    transport_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Toggle update trigger
CREATE TRIGGER update_salary_settings_updated_at
    BEFORE UPDATE ON salary_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

-- Policies (Public for dev)
CREATE POLICY "Allow public read access on salary_settings" ON salary_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on salary_settings" ON salary_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on salary_settings" ON salary_settings
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on salary_settings" ON salary_settings
    FOR DELETE USING (true);

-- Insert default row if not exists
INSERT INTO salary_settings (hourly_rate, overtime_rate, transport_fee, bonus)
SELECT 105.00, 150.00, 500.00, 2000.00
WHERE NOT EXISTS (SELECT 1 FROM salary_settings);

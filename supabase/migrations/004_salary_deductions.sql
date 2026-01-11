-- Add deduction columns to salary_settings table
ALTER TABLE salary_settings
ADD COLUMN IF NOT EXISTS xiaowang_diff DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS xiaowang_pension DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

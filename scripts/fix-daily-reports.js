// 修复 daily_reports 表结构的脚本
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('开始执行 daily_reports 表结构迁移...\n');

    // 读取 SQL 文件
    const sqlPath = join(__dirname, '../supabase/migrations/update_daily_reports_schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // 注意: Supabase JS 客户端不支持直接执行 DDL 语句
    // 需要使用 Supabase Dashboard 的 SQL Editor 或 psql
    console.log('⚠️  注意: 此脚本无法直接执行 DDL 语句');
    console.log('请按照以下步骤手动执行迁移:\n');
    console.log('1. 打开 Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. 选择你的项目');
    console.log('3. 进入 SQL Editor');
    console.log('4. 复制并执行以下 SQL:\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n5. 执行后，在 Settings > API 中点击 "Reload schema cache"');
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

runMigration();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase 配置缺失！请在 .env.local 文件中设置以下环境变量：\n' +
    '   VITE_SUPABASE_URL=your-supabase-url\n' +
    '   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key\n\n' +
    '获取方式：Supabase Dashboard -> Settings -> API'
  );
}

// Supabase 客户端配置，包含认证设置
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // 自动刷新会话
      autoRefreshToken: true,
      // 持久化会话到本地存储
      persistSession: true,
      // 检测会话变化
      detectSessionInUrl: true,
      // 会话存储键名
      storageKey: 'lifeos-auth-token',
      // 会话存储配置
      storage: window.localStorage,
      // 流程类型：隐式流程用于单页应用
      flowType: 'implicit'
    },
    // 全局配置
    global: {
      headers: {
        'X-Client-Info': 'lifeos-app'
      }
    }
  }
);

// 检查连接状态（用于调试）
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('tasks').select('count').limit(1);
    if (error) {
      console.error('Supabase 连接失败:', error.message);
      return false;
    }
    console.log('✅ Supabase 连接成功！');
    return true;
  } catch (err) {
    console.error('Supabase 连接异常:', err);
    return false;
  }
}

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // 从父目录加载环境变量
    const env = loadEnv(mode, '..', '');
    
    return {
        root: '.',  // 明确指定当前目录为根目录
        plugins: [
            react({
                jsxRuntime: 'automatic',
                babel: {
                    plugins: []
                }
            })
        ],
        // 将环境变量注入到客户端代码中
        define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        },
        server: {
            port: 3001,
        },
        build: {
            outDir: '../dist/admin',
            emptyOutDir: true,
        }
    };
});

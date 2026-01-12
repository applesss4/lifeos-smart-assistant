import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic',
            babel: {
                plugins: []
            }
        })
    ],
    server: {
        port: 3001,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    }
});

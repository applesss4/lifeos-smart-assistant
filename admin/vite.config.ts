
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname),
    envDir: path.resolve(__dirname, '..'),
    base: '/admin/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src'),
            '@admin': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
    },
    build: {
        outDir: '../dist/admin',
        emptyOutDir: true,
    }
});

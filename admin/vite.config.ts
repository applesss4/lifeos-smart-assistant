import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    
    return {
        plugins: [
            react({
                jsxRuntime: 'automatic',
                babel: {
                    plugins: []
                }
            }),
            // Bundle analyzer - generates stats.html after build
            visualizer({
                filename: './dist/stats.html',
                open: false,
                gzipSize: true,
                brotliSize: true,
                template: 'treemap', // 'sunburst', 'treemap', 'network'
            }),
            // Gzip compression
            viteCompression({
                verbose: true,
                disable: !isProduction,
                threshold: 10240, // Only compress files larger than 10KB
                algorithm: 'gzip',
                ext: '.gz',
                deleteOriginFile: false,
            }),
            // Brotli compression (better compression than gzip)
            viteCompression({
                verbose: true,
                disable: !isProduction,
                threshold: 10240,
                algorithm: 'brotliCompress',
                ext: '.br',
                deleteOriginFile: false,
            }),
        ],
        server: {
            port: 3001,
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '..'),
                'react': path.resolve(__dirname, '../node_modules/react'),
                'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
            },
            dedupe: ['react', 'react-dom']
        },
        // Build optimization configuration
        build: {
            // Target modern browsers for better optimization
            target: 'es2015',
            
            // Output directory
            outDir: 'dist',
            
            // Clean output directory before build
            emptyOutDir: true,
            
            // Chunk size warning limit (200KB as per requirements)
            chunkSizeWarningLimit: 200,
            
            // Enable/disable source maps based on environment
            sourcemap: isProduction ? true : false,
            
            // Minification configuration
            minify: 'terser',
            terserOptions: {
                compress: {
                    // Remove console and debugger in production
                    drop_console: isProduction,
                    drop_debugger: isProduction,
                    // Remove unused code
                    pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug', 'console.trace'] : [],
                    // Additional compression options
                    passes: 2, // Run compression multiple times for better results
                    unsafe: false, // Don't apply unsafe optimizations
                    unsafe_comps: false,
                    unsafe_math: false,
                    unsafe_proto: false,
                    // Remove dead code
                    dead_code: true,
                    // Evaluate constant expressions
                    evaluate: true,
                    // Inline functions
                    inline: 2,
                    // Join consecutive var statements
                    join_vars: true,
                    // Optimize loops
                    loops: true,
                    // Remove unused variables
                    unused: true,
                },
                mangle: {
                    // Mangle variable names for smaller output
                    toplevel: true,
                    safari10: true,
                },
                format: {
                    // Remove comments in production
                    comments: !isProduction,
                    // Preserve annotations for debugging
                    preserve_annotations: !isProduction,
                    // ASCII only output
                    ascii_only: true,
                },
            },
            
            // Rollup options for advanced bundling
            rollupOptions: {
                output: {
                    // Manual chunk splitting strategy
                    manualChunks: {
                        // Separate React vendor bundle
                        'react-vendor': ['react', 'react-dom'],
                        // Separate Supabase bundle
                        'supabase': ['@supabase/supabase-js'],
                        // Charts are now lazy-loaded, no need for manual chunk
                    },
                    
                    // Naming patterns for chunks
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash][extname]',
                    
                    // Optimize chunk generation
                    compact: isProduction,
                },
            },
            
            // CSS code splitting
            cssCodeSplit: true,
            
            // Asset inline limit (4KB)
            assetsInlineLimit: 4096,
            
            // Report compressed size
            reportCompressedSize: true,
        },
        
        // Optimize dependency pre-bundling
        optimizeDeps: {
            // Include dependencies that should be pre-bundled
            include: [
                'react',
                'react-dom',
                '@supabase/supabase-js',
                // Recharts is now lazy-loaded
            ],
            // Exclude dependencies that shouldn't be pre-bundled
            exclude: [],
        },
    };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: './',
    publicDir: 'splunk',
    build: {
        outDir: 'fleet_overview',
        emptyOutDir: false,
        minify: mode !== 'development',
        sourcemap: mode === 'development',
        rollupOptions: {
            output: {
                format: 'iife',
                inlineDynamicImports: true,
                entryFileNames: 'appserver/static/pages/[name].js',
                assetFileNames: 'appserver/static/pages/assets/[name]-[hash][extname]',
            },
        },
    },
    plugins: [
        react({
            plugins: [['@swc/plugin-styled-components', {}]],
        }),
    ],
}));

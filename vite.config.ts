import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: './',
    legacy: { inconsistentCjsInterop: true },
    publicDir: 'splunk',
    build: {
        outDir: 'dist/fleet_overview',
        emptyOutDir: false,
        minify: mode !== 'development',
        sourcemap: mode === 'development',
        rolldownOptions: {
            output: {
                format: 'iife',
                codeSplitting: false,
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

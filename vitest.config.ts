import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: { include: ['@testing-library/jest-dom/vitest'] },
    test: {
        attachmentsDir: './dist/test-attachments',
        globals: true,
        include: ['**/*.test.{ts,tsx}'],
        reporters: ['default'],
        setupFiles: './vitest.setup.ts',
        browser: {
            enabled: true,
            headless: true,
            viewport: { width: 1280, height: 720 },
            provider: playwright(),
            instances: [
                {
                    name: 'chrome',
                    browser: 'chromium',
                    provider: playwright({ launchOptions: { channel: 'chrome' } }),
                },
                {
                    name: 'edge',
                    browser: 'chromium',
                    provider: playwright({ launchOptions: { channel: 'msedge' } }),
                },
                { name: 'firefox', browser: 'firefox' },
                { name: 'webkit', browser: 'webkit' },
            ],
        },
    },
});

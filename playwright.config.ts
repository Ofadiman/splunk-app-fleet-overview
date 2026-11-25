import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    outputDir: './dist/playwright',
    use: {
        baseURL: 'http://localhost:18000',
        browserName: 'chromium',
        trace: 'retain-on-failure',
    },
});

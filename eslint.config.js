import splunkConfig from '@splunk/eslint-config/flat-browser-prettier.mjs';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'stage']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [...splunkConfig, ...tseslint.configs.recommended, reactRefresh.configs.vite],
        languageOptions: {
            ecmaVersion: 'latest',
        },
        rules: {
            'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
        },
    },
]);

import { fileURLToPath } from 'node:url';

const testingFile = (name: string) =>
    fileURLToPath(new URL(`./src/testing/${name}`, import.meta.url));

export const sharedComponentSpecs = 'src/**/*.test.{ts,tsx}';

export const testAliases = {
    '#original-splunk-line': '@splunk/visualizations/Line.js',
    '#original-splunk-column': '@splunk/visualizations/Column.js',
    '@splunk/splunk-utils/search': testingFile('SearchMock.ts'),
    '@splunk/visualizations/Line': testingFile('LineMock.tsx'),
    '@splunk/visualizations/Column': testingFile('ColumnMock.tsx'),
    '@splunk/react-time-range/SplunkwebConnector': testingFile('SplunkwebConnectorMock.tsx'),
};

export const testDependencyOptimization = {
    include: [
        '@splunk/splunk-utils/search.js',
        '@splunk/visualizations/Line.js',
        '@splunk/visualizations/Column.js',
        '@splunk/react-time-range/presets',
    ],
    exclude: [
        '@splunk/splunk-utils/search',
        '@splunk/visualizations/Line',
        '@splunk/visualizations/Column',
        '@splunk/react-time-range/SplunkwebConnector',
    ],
};

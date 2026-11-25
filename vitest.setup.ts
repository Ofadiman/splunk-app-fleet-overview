import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeEach } from 'vitest';
import { commands } from 'vitest/browser';
import type { CoverageMapData } from 'istanbul-lib-coverage';
import { disableComponentDoubles, enableComponentDoubles } from './src/testing/doubles';

beforeEach(enableComponentDoubles);
afterEach(disableComponentDoubles);

declare module 'vitest/browser' {
    interface BrowserCommands {
        recordCoverage(coverage: CoverageMapData): Promise<null>;
    }
}

if (import.meta.env.FLEET_TEST_COVERAGE) {
    afterAll(async () => {
        const coverage: CoverageMapData | undefined = Reflect.get(globalThis, '__coverage__');
        if (coverage) await commands.recordCoverage(coverage);
    });
}

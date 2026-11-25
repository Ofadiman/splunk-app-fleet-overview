import { oneShot as runSearch } from '@splunk/splunk-utils/search.js';
import { fn } from '@vitest/spy';
import { componentDoublesEnabled } from './doubles';

export const searchMock = fn<typeof runSearch>();

export const oneShot: typeof runSearch = (...args) =>
    (componentDoublesEnabled() ? searchMock : runSearch)(...args);

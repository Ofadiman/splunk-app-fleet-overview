import type { ForwarderColumn, ForwarderSort, SortOrder } from './ProblemForwardersTable.types';

export const TIEBREAKERS: Record<ForwarderColumn, ForwarderColumn[]> = {
    failingApps: ['failingHours', 'reconnects'],
    failingHours: ['failingApps', 'reconnects'],
    reconnects: ['failingApps', 'failingHours'],
};

export const FORWARDER_COLUMNS = Object.keys(TIEBREAKERS) as ForwarderColumn[];

export const SORT_ORDERS: SortOrder[] = ['desc', 'asc'];

export const DEFAULT_FORWARDER_SORT: ForwarderSort = { column: 'failingApps', order: 'desc' };

export const ROW_LIMIT = 100;

export const ALL_RESULTS = 0;

export const TABLE_MAX_HEIGHT = 480;

export const LOADING_HEIGHT = 120;

export const MISSING_VALUE = '—';

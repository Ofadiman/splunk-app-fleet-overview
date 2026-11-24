import type { AppStatus } from './AgentAppsTable.types';

export const ALL_TIME = '0';

export const ALL_RESULTS = 0;

export const MISSING_VALUE = '—';

export const LOADING_HEIGHT = 120;

export const COLUMN_WIDTHS = {
    app: 220,
    serverClass: 180,
    status: 130,
    time: 200,
};

export const APP_STATUSES: AppStatus[] = ['failing', 'installed', 'uninstalled', 'downloaded'];

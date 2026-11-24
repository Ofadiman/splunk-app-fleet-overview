import type { AppAction } from './AgentActivity.types';

export const ENTRY_LIMIT = 100;

export const LOADING_HEIGHT = 120;

export const COLUMN_WIDTHS = {
    time: 340,
    event: 340,
};

export const APP_ACTIONS: AppAction[] = ['Download', 'Install', 'Uninstall'];

export const OK_RESULT = 'Ok';

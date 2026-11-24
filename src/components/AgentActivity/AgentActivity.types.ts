import type { TimeRange } from '../TimeRangeControls/TimeRangeControls.types';

export type AgentActivityProps = {
    guid: string;
    timeRange: TimeRange;
};

export type AgentActivitySearch = TimeRange & {
    guid: string;
};

export type AppAction = 'Download' | 'Install' | 'Uninstall';

export type ActivityEntry = {
    kind: 'app' | 'reconnect';
    first: number;
    last: number;
    times: number;
    app?: string;
    action?: string;
    result?: string;
    reason?: string;
    name?: string;
    version?: string;
    ip?: string;
    previousName?: string;
    previousVersion?: string;
    previousIp?: string;
};

export type AgentActivityResults = {
    entries: ActivityEntry[];
    total: number;
};

export type IdentityChange = {
    field: 'name' | 'version' | 'ip';
    from: string;
    to: string;
};

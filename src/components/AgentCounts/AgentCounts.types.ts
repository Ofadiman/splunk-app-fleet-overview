import type { TimeRange } from '../TimeRangeControls/TimeRangeControls.types';

export type AgentCountsProps = {
    guid: string;
    timeRange: TimeRange;
};

export type AgentCountsSearch = TimeRange & {
    guid: string;
};

export type AgentProblemCounts = {
    failingApps: number;
    failingHours: number;
    reconnects: number;
};

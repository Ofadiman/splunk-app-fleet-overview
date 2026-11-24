import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';

export type AgentDetailsProps = {
    guid: string;
    timeRange: ChartTimeRange;
    onTimeRangeChange: (timeRange: ChartTimeRange) => void;
};

export type AgentSummary = {
    name?: string;
    host?: string;
    ip?: string;
    version?: string;
    build?: string;
    os?: string;
    package?: string;
    packageType?: string;
    lastPhoneHome?: number;
    interval?: number;
};

export type PhoneHomeStatus = 'phoningHome' | 'late' | 'silent' | 'noInterval' | 'none';

import type {
    ChartTimeRange,
    Span,
    SpanSearch,
} from '../TimeRangeControls/TimeRangeControls.types';

export type { Span };

export type AgentPhoneHomesChartProps = {
    guid: string;
    timeRange: ChartTimeRange;
};

export type AgentSpanSearch = SpanSearch & {
    guid: string;
};

export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type AgentPhoneHomes = {
    times: string[];
    counts: string[];
};

import type {
    ChartTimeRange,
    Span,
    SpanSearch,
} from '../TimeRangeControls/TimeRangeControls.types';

export type { Span };

export type AgentReconnectsChartProps = {
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

export type AgentReconnects = {
    times: string[];
    counts: string[];
};

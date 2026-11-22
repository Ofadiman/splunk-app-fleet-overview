import type {
    ChartTimeRange,
    Span,
    SpanSearch,
} from '../TimeRangeControls/TimeRangeControls.types';

export type { Span, SpanSearch };

export type ConnectedForwardersChartProps = {
    timeRange: ChartTimeRange;
};

export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type ConnectedForwarders = {
    times: string[];
    counts: string[];
};

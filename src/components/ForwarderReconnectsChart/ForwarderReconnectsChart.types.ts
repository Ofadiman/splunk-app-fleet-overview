import type {
    ChartTimeRange,
    Span,
    SpanSearch,
} from '../TimeRangeControls/TimeRangeControls.types';

export type { Span, SpanSearch };

export type ForwarderReconnectsChartProps = {
    timeRange: ChartTimeRange;
};

export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type ForwarderReconnects = {
    times: string[];
    counts: string[];
};

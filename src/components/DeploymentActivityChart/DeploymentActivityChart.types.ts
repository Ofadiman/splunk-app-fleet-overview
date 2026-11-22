import type {
    ChartTimeRange,
    Span,
    SpanSearch,
} from '../TimeRangeControls/TimeRangeControls.types';

export type { Span, SpanSearch };

export type DeploymentActivityChartProps = {
    timeRange: ChartTimeRange;
};

export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type DeploymentActivity = {
    times: string[];
    installed: string[];
    uninstalled: string[];
    failed: string[];
};

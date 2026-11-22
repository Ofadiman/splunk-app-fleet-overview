export type Span = '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '1d' | '7d';

export type Resolution = 'auto' | Span;

export type TimeRange = {
    earliest: string;
    latest: string;
};

export type ChartTimeRange = TimeRange & {
    resolution: Resolution;
};

export type SpanSearch = TimeRange & {
    span: Span;
};

export type TimeRangeControlsProps = {
    value: ChartTimeRange;
    onChange: (value: ChartTimeRange) => void;
};

export type ParsedTimes = Partial<Record<string, string>>;

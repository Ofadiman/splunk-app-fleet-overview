import type { ChartTimeRange, Span } from './TimeRangeControls.types';

export const AUTO_RESOLUTION = 'auto';

export const SPAN_MINUTES: Record<Span, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '6h': 360,
    '1d': 1440,
    '7d': 10080,
};

export const SPANS = Object.keys(SPAN_MINUTES) as Span[];

export const DEFAULT_TIME_RANGE: ChartTimeRange = {
    earliest: '-24h@h',
    latest: 'now',
    resolution: '1h',
};

export const ALL_TIME_EARLIEST = '0';

export const NOW = 'now';

export const AUTO_MAX_BUCKETS = 100;

export const MIN_BUCKETS = 2;

export const MAX_BUCKETS = 1440;

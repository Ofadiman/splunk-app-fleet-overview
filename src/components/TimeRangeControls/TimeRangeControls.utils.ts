import {
    AUTO_MAX_BUCKETS,
    AUTO_RESOLUTION,
    MAX_BUCKETS,
    MIN_BUCKETS,
    SPAN_MINUTES,
    SPANS,
} from './TimeRangeControls.constants';
import type { Resolution, Span } from './TimeRangeControls.types';

export const bucketCount = (span: Span, durationSeconds: number) =>
    Math.ceil(durationSeconds / (SPAN_MINUTES[span] * 60));

export const spanFit = (span: Span, durationSeconds: number) => {
    const buckets = bucketCount(span, durationSeconds);
    if (buckets > MAX_BUCKETS) {
        return 'tooShort';
    }
    if (buckets < MIN_BUCKETS) {
        return 'tooLong';
    }
    return 'fits';
};

export const autoSpan = (durationSeconds: number) =>
    SPANS.find((span) => bucketCount(span, durationSeconds) <= AUTO_MAX_BUCKETS) ??
    SPANS[SPANS.length - 1];

export const effectiveSpan = (resolution: Resolution, durationSeconds: number) =>
    resolution !== AUTO_RESOLUTION && spanFit(resolution, durationSeconds) === 'fits'
        ? resolution
        : autoSpan(durationSeconds);

export const isResolution = (value: unknown): value is Resolution =>
    value === AUTO_RESOLUTION || SPANS.some((span) => span === value);

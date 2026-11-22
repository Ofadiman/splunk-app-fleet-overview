import type { SearchSchemaInput } from '@tanstack/react-router';
import { DEFAULT_TIME_RANGE } from '../../components/TimeRangeControls/TimeRangeControls.constants';
import type { ChartTimeRange } from '../../components/TimeRangeControls/TimeRangeControls.types';
import { isResolution } from '../../components/TimeRangeControls/TimeRangeControls.utils';

export type OverviewSearchInput = Partial<Record<keyof ChartTimeRange, unknown>> &
    SearchSchemaInput;

const toTime = (value: unknown, fallback: string) => {
    if (typeof value === 'string') {
        return value;
    }
    return typeof value === 'number' ? String(value) : fallback;
};

export const validateOverviewSearch = (search: OverviewSearchInput): ChartTimeRange => ({
    earliest: toTime(search.earliest, DEFAULT_TIME_RANGE.earliest),
    latest: toTime(search.latest, DEFAULT_TIME_RANGE.latest),
    resolution: isResolution(search.resolution) ? search.resolution : DEFAULT_TIME_RANGE.resolution,
});

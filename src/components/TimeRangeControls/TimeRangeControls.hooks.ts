import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit, handleError, handleResponse } from '@splunk/splunk-utils/fetch';
import { createRESTURL } from '@splunk/splunk-utils/url';
import { ALL_TIME_EARLIEST, NOW } from './TimeRangeControls.constants';
import { messages } from './TimeRangeControls.i18n';
import type { ChartTimeRange, ParsedTimes, TimeRange } from './TimeRangeControls.types';
import { effectiveSpan } from './TimeRangeControls.utils';

export const timeRangeDurationQuery = ({ earliest, latest }: TimeRange) =>
    queryOptions({
        queryKey: ['time-range-duration', earliest, latest],
        queryFn: async ({ signal }) => {
            const from = earliest || ALL_TIME_EARLIEST;
            const to = latest || NOW;
            const params = new URLSearchParams({ output_mode: 'json', output_time_format: '%s' });
            params.append('time', from);
            params.append('time', to);

            const parsed = await fetch(
                `${createRESTURL('search/timeparser')}?${params}`,
                createFetchInit({ signal }),
            )
                .then(handleResponse<ParsedTimes>(200))
                .catch(handleError(messages.timeParseError));
            const duration = Number(parsed?.[to]) - Number(parsed?.[from]);

            if (!Number.isFinite(duration)) {
                throw new Error(messages.timeParseError);
            }
            return duration;
        },
    });

export const useTimeRangeDuration = (timeRange: TimeRange) =>
    useQuery(timeRangeDurationQuery(timeRange)).data;

export const useFetchTimeRangeDuration = () => {
    const queryClient = useQueryClient();
    return (timeRange: TimeRange) => queryClient.fetchQuery(timeRangeDurationQuery(timeRange));
};

export const useChartSpan = ({ resolution, ...timeRange }: ChartTimeRange) =>
    useSuspenseQuery({
        ...timeRangeDurationQuery(timeRange),
        select: (duration) => effectiveSpan(resolution, duration),
    }).data;

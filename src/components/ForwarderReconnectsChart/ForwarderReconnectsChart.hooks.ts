import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    EARLIEST_TIME,
    FORWARDER_RECONNECTS_SEARCH,
    LATEST_TIME,
    RECONNECTS_FIELD,
    TIME_FIELD,
} from './ForwarderReconnectsChart.constants';
import type { ForwarderReconnects, SearchResults } from './ForwarderReconnectsChart.types';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

export const forwarderReconnectsQuery = queryOptions({
    queryKey: ['forwarder-reconnects'],
    queryFn: async ({ signal }): Promise<ForwarderReconnects> => {
        const results = (await oneShot(
            {
                search: FORWARDER_RECONNECTS_SEARCH,
                earliest_time: EARLIEST_TIME,
                latest_time: LATEST_TIME,
                output_mode: 'json_cols',
            },
            undefined,
            undefined,
            createFetchInit({ signal }),
        )) as SearchResults;

        return {
            times: getColumn(results, TIME_FIELD),
            counts: getColumn(results, RECONNECTS_FIELD),
        };
    },
});

export const useForwarderReconnects = () => useSuspenseQuery(forwarderReconnectsQuery);

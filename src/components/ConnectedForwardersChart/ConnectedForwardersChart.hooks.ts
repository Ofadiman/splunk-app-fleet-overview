import { queryOptions, useQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    CONNECTED_FIELD,
    CONNECTED_FORWARDERS_SEARCH,
    EARLIEST_TIME,
    LATEST_TIME,
    REFRESH_INTERVAL_MS,
    TIME_FIELD,
} from './ConnectedForwardersChart.constants';
import type { ConnectedForwarders, SearchResults } from './ConnectedForwardersChart.types';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const connectedForwardersQuery = queryOptions({
    queryKey: ['connected-forwarders'],
    queryFn: async ({ signal }): Promise<ConnectedForwarders> => {
        const results = (await oneShot(
            {
                search: CONNECTED_FORWARDERS_SEARCH,
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
            counts: getColumn(results, CONNECTED_FIELD),
        };
    },
    refetchInterval: REFRESH_INTERVAL_MS,
});

export const useConnectedForwarders = () => useQuery(connectedForwardersQuery);

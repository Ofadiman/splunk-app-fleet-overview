import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    CONNECTED_FIELD,
    CONNECTED_FORWARDERS_SEARCH,
    EARLIEST_TIME,
    LATEST_TIME,
    TIME_FIELD,
} from './ConnectedForwardersChart.constants';
import { deploymentActivityQuery } from '../DeploymentActivityChart/DeploymentActivityChart.hooks';
import { forwarderReconnectsQuery } from '../ForwarderReconnectsChart/ForwarderReconnectsChart.hooks';
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
});

export const useConnectedForwarders = () => useSuspenseQuery(connectedForwardersQuery);

export const useMarkerSources = () => ({
    deployments: useQuery(deploymentActivityQuery).data,
    reconnects: useQuery(forwarderReconnectsQuery).data,
});

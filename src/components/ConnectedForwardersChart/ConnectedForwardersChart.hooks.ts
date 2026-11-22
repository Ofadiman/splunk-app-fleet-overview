import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS, CONNECTED_FIELD, TIME_FIELD } from './ConnectedForwardersChart.constants';
import type {
    ConnectedForwarders,
    SearchResults,
    SpanSearch,
} from './ConnectedForwardersChart.types';
import { connectedForwardersSearch } from './ConnectedForwardersChart.utils';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const connectedForwardersQuery = ({ earliest, latest, span }: SpanSearch) =>
    queryOptions({
        queryKey: ['connected-forwarders', earliest, latest, span],
        queryFn: async ({ signal }): Promise<ConnectedForwarders> => {
            const results = (await oneShot(
                {
                    search: connectedForwardersSearch(span),
                    earliest_time: earliest,
                    latest_time: latest,
                    output_mode: 'json_cols',
                    count: ALL_RESULTS,
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

export const useConnectedForwarders = (search: SpanSearch) =>
    useSuspenseQuery(connectedForwardersQuery(search));

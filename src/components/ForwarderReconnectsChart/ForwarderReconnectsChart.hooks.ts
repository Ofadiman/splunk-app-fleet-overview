import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS, RECONNECTS_FIELD, TIME_FIELD } from './ForwarderReconnectsChart.constants';
import type {
    ForwarderReconnects,
    SearchResults,
    SpanSearch,
} from './ForwarderReconnectsChart.types';
import { forwarderReconnectsSearch } from './ForwarderReconnectsChart.utils';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const forwarderReconnectsQuery = ({ earliest, latest, span }: SpanSearch) =>
    queryOptions({
        queryKey: ['forwarder-reconnects', earliest, latest, span],
        queryFn: async ({ signal }): Promise<ForwarderReconnects> => {
            const results = (await oneShot(
                {
                    search: forwarderReconnectsSearch(span),
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
                counts: getColumn(results, RECONNECTS_FIELD),
            };
        },
    });

export const useForwarderReconnects = (search: SpanSearch) =>
    useSuspenseQuery(forwarderReconnectsQuery(search));

import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS, COUNT_FIELD, TIME_FIELD } from './AgentReconnectsChart.constants';
import type { AgentReconnects, AgentSpanSearch, SearchResults } from './AgentReconnectsChart.types';
import { agentReconnectsSearch } from './AgentReconnectsChart.utils';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const agentReconnectsQuery = ({ guid, earliest, latest, span }: AgentSpanSearch) =>
    queryOptions({
        queryKey: ['agent-reconnects', guid, earliest, latest, span],
        queryFn: async ({ signal }): Promise<AgentReconnects> => {
            const results = (await oneShot(
                {
                    search: agentReconnectsSearch(guid, span),
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
                counts: getColumn(results, COUNT_FIELD),
            };
        },
    });

export const useAgentReconnects = (search: AgentSpanSearch) =>
    useSuspenseQuery(agentReconnectsQuery(search));

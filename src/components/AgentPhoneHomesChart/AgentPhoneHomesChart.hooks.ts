import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS, COUNT_FIELD, TIME_FIELD } from './AgentPhoneHomesChart.constants';
import type { AgentPhoneHomes, AgentSpanSearch, SearchResults } from './AgentPhoneHomesChart.types';
import { agentPhoneHomesSearch } from './AgentPhoneHomesChart.utils';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const agentPhoneHomesQuery = ({ guid, earliest, latest, span }: AgentSpanSearch) =>
    queryOptions({
        queryKey: ['agent-phone-homes', guid, earliest, latest, span],
        queryFn: async ({ signal }): Promise<AgentPhoneHomes> => {
            const results = (await oneShot(
                {
                    search: agentPhoneHomesSearch(guid, span),
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

export const useAgentPhoneHomes = (search: AgentSpanSearch) =>
    useSuspenseQuery(agentPhoneHomesQuery(search));

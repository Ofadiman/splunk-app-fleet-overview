import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { agentCountsResultsSchema } from './AgentCounts.schema';
import type { AgentCountsSearch, AgentProblemCounts } from './AgentCounts.types';
import { agentCountsSearch } from './AgentCounts.utils';

const agentCountsQuery = ({ guid, earliest, latest }: AgentCountsSearch) =>
    queryOptions({
        queryKey: ['agent-counts', guid, earliest, latest],
        queryFn: async ({ signal }): Promise<AgentProblemCounts> => {
            const results = await oneShot(
                {
                    search: agentCountsSearch(guid),
                    earliest_time: earliest,
                    latest_time: latest,
                    output_mode: 'json',
                },
                undefined,
                undefined,
                createFetchInit({ signal }),
            );

            return agentCountsResultsSchema.parse(results);
        },
    });

export const useAgentCounts = (search: AgentCountsSearch) =>
    useSuspenseQuery(agentCountsQuery(search));

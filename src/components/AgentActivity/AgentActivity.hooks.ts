import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { agentActivityResultsSchema } from './AgentActivity.schema';
import type { AgentActivityResults, AgentActivitySearch } from './AgentActivity.types';
import { agentActivitySearch } from './AgentActivity.utils';

const agentActivityQuery = ({ guid, earliest, latest }: AgentActivitySearch) =>
    queryOptions({
        queryKey: ['agent-activity', guid, earliest, latest],
        queryFn: async ({ signal }): Promise<AgentActivityResults> => {
            const results = await oneShot(
                {
                    search: agentActivitySearch(guid),
                    earliest_time: earliest,
                    latest_time: latest,
                    output_mode: 'json',
                },
                undefined,
                undefined,
                createFetchInit({ signal }),
            );

            return agentActivityResultsSchema.parse(results);
        },
    });

export const useAgentActivity = (search: AgentActivitySearch) =>
    useSuspenseQuery(agentActivityQuery(search));

import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_TIME } from './AgentDetails.constants';
import { agentSummaryResultsSchema } from './AgentDetails.schema';
import { agentSummarySearch } from './AgentDetails.utils';

const agentSummaryQuery = (guid: string) =>
    queryOptions({
        queryKey: ['agent-summary', guid],
        queryFn: async ({ signal }) => {
            const results = await oneShot(
                {
                    search: agentSummarySearch(guid),
                    earliest_time: ALL_TIME,
                    latest_time: 'now',
                    output_mode: 'json',
                },
                undefined,
                undefined,
                createFetchInit({ signal }),
            );

            return agentSummaryResultsSchema.parse(results);
        },
    });

export const useAgentSummary = (guid: string) => useSuspenseQuery(agentSummaryQuery(guid));

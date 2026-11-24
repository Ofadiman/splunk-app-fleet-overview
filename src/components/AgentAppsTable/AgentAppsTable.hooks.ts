import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS, ALL_TIME } from './AgentAppsTable.constants';
import { agentAppsResultsSchema } from './AgentAppsTable.schema';
import type { AgentApp } from './AgentAppsTable.types';
import { agentAppsSearch } from './AgentAppsTable.utils';

const agentAppsQuery = (guid: string) =>
    queryOptions({
        queryKey: ['agent-apps', guid],
        queryFn: async ({ signal }): Promise<AgentApp[]> => {
            const results = await oneShot(
                {
                    search: agentAppsSearch(guid),
                    earliest_time: ALL_TIME,
                    latest_time: 'now',
                    output_mode: 'json',
                    count: ALL_RESULTS,
                },
                undefined,
                undefined,
                createFetchInit({ signal }),
            );

            return agentAppsResultsSchema.parse(results);
        },
    });

export const useAgentApps = (guid: string) => useSuspenseQuery(agentAppsQuery(guid));

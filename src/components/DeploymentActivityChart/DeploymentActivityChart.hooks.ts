import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    DEPLOYMENT_ACTIVITY_SEARCH,
    EARLIEST_TIME,
    FAILED_FIELD,
    INSTALLED_FIELD,
    LATEST_TIME,
    TIME_FIELD,
    UNINSTALLED_FIELD,
} from './DeploymentActivityChart.constants';
import type { DeploymentActivity, SearchResults } from './DeploymentActivityChart.types';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

export const deploymentActivityQuery = queryOptions({
    queryKey: ['deployment-activity'],
    queryFn: async ({ signal }): Promise<DeploymentActivity> => {
        const results = (await oneShot(
            {
                search: DEPLOYMENT_ACTIVITY_SEARCH,
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
            installed: getColumn(results, INSTALLED_FIELD),
            uninstalled: getColumn(results, UNINSTALLED_FIELD),
            failed: getColumn(results, FAILED_FIELD),
        };
    },
});

export const useDeploymentActivity = () => useSuspenseQuery(deploymentActivityQuery);

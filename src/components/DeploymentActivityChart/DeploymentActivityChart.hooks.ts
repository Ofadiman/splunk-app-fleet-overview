import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    ALL_RESULTS,
    FAILED_FIELD,
    INSTALLED_FIELD,
    TIME_FIELD,
    UNINSTALLED_FIELD,
} from './DeploymentActivityChart.constants';
import type {
    DeploymentActivity,
    SearchResults,
    SpanSearch,
} from './DeploymentActivityChart.types';
import { deploymentActivitySearch } from './DeploymentActivityChart.utils';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

const deploymentActivityQuery = ({ earliest, latest, span }: SpanSearch) =>
    queryOptions({
        queryKey: ['deployment-activity', earliest, latest, span],
        queryFn: async ({ signal }): Promise<DeploymentActivity> => {
            const results = (await oneShot(
                {
                    search: deploymentActivitySearch(span),
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
                installed: getColumn(results, INSTALLED_FIELD),
                uninstalled: getColumn(results, UNINSTALLED_FIELD),
                failed: getColumn(results, FAILED_FIELD),
            };
        },
    });

export const useDeploymentActivity = (search: SpanSearch) =>
    useSuspenseQuery(deploymentActivityQuery(search));

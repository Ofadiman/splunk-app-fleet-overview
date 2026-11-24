import { useLayoutEffect, useRef } from 'react';
import type { UIEvent } from 'react';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import { ALL_RESULTS } from './ProblemForwardersTable.constants';
import { searchResultsSchema } from './ProblemForwardersTable.schema';
import type {
    ForwarderSearch,
    ForwarderSort,
    ProblemForwarders,
} from './ProblemForwardersTable.types';
import { problemForwardersSearch } from './ProblemForwardersTable.utils';

const problemForwardersQuery = ({ earliest, latest, column, order }: ForwarderSearch) =>
    queryOptions({
        queryKey: ['problem-forwarders', earliest, latest, column, order],
        queryFn: async ({ signal }): Promise<ProblemForwarders> => {
            const results = await oneShot(
                {
                    search: problemForwardersSearch({ column, order }),
                    earliest_time: earliest,
                    latest_time: latest,
                    output_mode: 'json',
                    count: ALL_RESULTS,
                },
                undefined,
                undefined,
                createFetchInit({ signal }),
            );

            return searchResultsSchema.parse(results);
        },
    });

export const useProblemForwarders = (search: ForwarderSearch) =>
    useSuspenseQuery(problemForwardersQuery(search));

export const useScrollToTopOnSort = ({ column, order }: ForwarderSort) => {
    const scrolledList = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        if (scrolledList.current) {
            scrolledList.current.scrollTop = 0;
        }
    }, [column, order]);

    return (event: UIEvent<HTMLElement>) => {
        scrolledList.current = event.currentTarget;
    };
};

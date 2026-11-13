import { useEffect, useState } from 'react';
import { createFetchInit } from '@splunk/splunk-utils/fetch';
import { oneShot } from '@splunk/splunk-utils/search';
import {
    CONNECTED_FIELD,
    CONNECTED_FORWARDERS_SEARCH,
    EARLIEST_TIME,
    LATEST_TIME,
    REFRESH_INTERVAL_MS,
    TIME_FIELD,
} from './ConnectedForwardersChart.constants';
import type { ConnectedForwardersState, SearchResults } from './ConnectedForwardersChart.types';

const getColumn = ({ fields, columns }: SearchResults, field: string) =>
    columns[fields.indexOf(field)] ?? [];

export const useConnectedForwarders = () => {
    const [state, setState] = useState<ConnectedForwardersState>({ status: 'loading' });

    useEffect(() => {
        const controller = new AbortController();

        const load = () => {
            oneShot(
                {
                    search: CONNECTED_FORWARDERS_SEARCH,
                    earliest_time: EARLIEST_TIME,
                    latest_time: LATEST_TIME,
                    output_mode: 'json_cols',
                },
                undefined,
                undefined,
                createFetchInit({ signal: controller.signal }),
            ).then(
                (response) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    const results = response as SearchResults;
                    setState({
                        status: 'success',
                        times: getColumn(results, TIME_FIELD),
                        counts: getColumn(results, CONNECTED_FIELD),
                    });
                },
                (error: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setState({
                        status: 'error',
                        message: error instanceof Error ? error.message : String(error),
                    });
                },
            );
        };

        load();
        const interval = window.setInterval(load, REFRESH_INTERVAL_MS);

        return () => {
            controller.abort();
            window.clearInterval(interval);
        };
    }, []);

    return state;
};

import type { DefaultOptions } from '@tanstack/react-query';

export const queryClientDefaultOptions = {
    queries: {
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    },
    mutations: {
        retry: false,
    },
} satisfies DefaultOptions;

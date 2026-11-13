export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type ConnectedForwardersState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; times: string[]; counts: string[] };

export type ChartContentProps = {
    state: ConnectedForwardersState;
};

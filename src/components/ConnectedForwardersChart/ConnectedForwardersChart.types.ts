export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type ConnectedForwarders = {
    times: string[];
    counts: string[];
};

export type MinuteDeployments = {
    times: string[];
    installed: string[];
    uninstalled: string[];
    failed: string[];
};

export type MinuteReconnects = {
    times: string[];
    counts: string[];
};

export type MarkerLabels = {
    installed: string;
    uninstalled: string;
    failed: string;
    reconnects: string;
};

export type MarkerColors = {
    failure: string;
    change: string;
};

export type ChartMarkers = {
    times: string[];
    labels: string[];
    colors: string[];
};

export type SearchResults = {
    fields: string[];
    columns: string[][];
};

export type DeploymentActivity = {
    times: string[];
    installed: string[];
    uninstalled: string[];
    failed: string[];
};

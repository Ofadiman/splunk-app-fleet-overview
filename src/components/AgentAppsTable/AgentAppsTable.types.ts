export type AgentAppsTableProps = {
    guid: string;
};

export type AppStatus = 'failing' | 'installed' | 'uninstalled' | 'downloaded';

export type AgentApp = {
    app: string;
    serverClass: string;
    status: AppStatus;
    lastSuccess?: number;
    failingSince?: number;
    reason?: string;
};

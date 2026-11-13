export const TIME_FIELD = '_time';

export const CONNECTED_FIELD = 'connected';

export const CONNECTED_FORWARDERS_SEARCH = [
    '| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=1m',
    `| timechart span=1m dc(data.clientId) AS ${CONNECTED_FIELD}`,
    '| fields - _span',
].join(' ');

export const EARLIEST_TIME = '-60m@m';

export const LATEST_TIME = '@m';

export const REFRESH_INTERVAL_MS = 60_000;

export const CHART_HEIGHT = 300;

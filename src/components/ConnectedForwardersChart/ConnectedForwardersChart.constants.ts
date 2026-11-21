export const TIME_FIELD = '_time';

export const CONNECTED_FIELD = 'connected';

export const CONNECTED_FORWARDERS_SEARCH = [
    '| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=1m',
    `| timechart span=1m dc(data.clientId) AS ${CONNECTED_FIELD}`,
    '| fields - _span',
].join(' ');

export const EARLIEST_TIME = '-60m@m';

export const LATEST_TIME = '@m';

export const CHART_HEIGHT = 300;

export const MARKER_MIN_SHARE = 0.01;

export const MARKER_LABEL_FIELD = 'label';

export const MARKER_COLOR_FIELD = 'color';

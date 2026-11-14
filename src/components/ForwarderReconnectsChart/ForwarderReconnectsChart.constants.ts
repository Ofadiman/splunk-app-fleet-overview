export const TIME_FIELD = '_time';

export const RECONNECTS_FIELD = 'reconnects';

export const FORWARDER_RECONNECTS_SEARCH = [
    '| tstats prestats=t count where index=_dsclient by _time span=1m',
    `| timechart span=1m count AS ${RECONNECTS_FIELD}`,
    '| fields - _span',
].join(' ');

export const EARLIEST_TIME = '-60m@m';

export const LATEST_TIME = '@m';

export const CHART_HEIGHT = 300;

export const MAX_COUNT_WITH_UNIT_TICKS = 5;

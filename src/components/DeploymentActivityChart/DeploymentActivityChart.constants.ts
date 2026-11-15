export const TIME_FIELD = '_time';

export const INSTALLED_FIELD = 'installed';

export const UNINSTALLED_FIELD = 'uninstalled';

export const FAILED_FIELD = 'failed';

export const DEPLOYMENT_ACTIVITY_SEARCH = [
    '| tstats count where index=_dsappevent by _time span=1m data.clientId data.appName data.action data.result',
    `| eval downloaded=if('data.action'="Download" AND 'data.result'="Ok", 1, 0)`,
    `| eval ${INSTALLED_FIELD}=if('data.action'="Install" AND 'data.result'="Ok", 1, 0)`,
    `| eval ${UNINSTALLED_FIELD}=if('data.action'="Uninstall" AND 'data.result'="Ok", 1, 0)`,
    `| eval ${FAILED_FIELD}=if('data.result'!="Ok", 1, 0)`,
    `| stats max(downloaded) AS downloaded max(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} max(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} max(${FAILED_FIELD}) AS ${FAILED_FIELD} by _time data.clientId data.appName`,
    `| eval ${INSTALLED_FIELD}=downloaded*${INSTALLED_FIELD}`,
    `| stats max(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} max(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} max(${FAILED_FIELD}) AS ${FAILED_FIELD} by _time data.clientId`,
    `| timechart span=1m sum(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} sum(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} sum(${FAILED_FIELD}) AS ${FAILED_FIELD}`,
    `| fillnull value=0 ${INSTALLED_FIELD} ${UNINSTALLED_FIELD} ${FAILED_FIELD}`,
    '| fields - _span',
].join(' ');

export const EARLIEST_TIME = '-60m@m';

export const LATEST_TIME = '@m';

export const CHART_HEIGHT = 300;

export const SMALL_TICK_INTERVALS = [1, 2, 5];

export const MAX_TICKS = 5;

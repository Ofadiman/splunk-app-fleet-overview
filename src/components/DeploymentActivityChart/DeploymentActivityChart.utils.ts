import {
    FAILED_FIELD,
    INSTALLED_FIELD,
    MAX_TICKS,
    SMALL_TICK_INTERVALS,
    UNINSTALLED_FIELD,
} from './DeploymentActivityChart.constants';
import type { Span } from './DeploymentActivityChart.types';

export const deploymentActivitySearch = (span: Span) =>
    [
        `| tstats count where index=_dsappevent by _time span=${span} data.clientId data.appName data.action data.result`,
        `| eval downloaded=if('data.action'="Download" AND 'data.result'="Ok", 1, 0)`,
        `| eval ${INSTALLED_FIELD}=if('data.action'="Install" AND 'data.result'="Ok", 1, 0)`,
        `| eval ${UNINSTALLED_FIELD}=if('data.action'="Uninstall" AND 'data.result'="Ok", 1, 0)`,
        `| eval ${FAILED_FIELD}=if('data.result'!="Ok", 1, 0)`,
        `| stats max(downloaded) AS downloaded max(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} max(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} max(${FAILED_FIELD}) AS ${FAILED_FIELD} by _time data.clientId data.appName`,
        `| eval ${INSTALLED_FIELD}=downloaded*${INSTALLED_FIELD}`,
        `| stats max(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} max(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} max(${FAILED_FIELD}) AS ${FAILED_FIELD} by _time data.clientId`,
        `| timechart span=${span} sum(${INSTALLED_FIELD}) AS ${INSTALLED_FIELD} sum(${UNINSTALLED_FIELD}) AS ${UNINSTALLED_FIELD} sum(${FAILED_FIELD}) AS ${FAILED_FIELD}`,
        `| fillnull value=0 ${INSTALLED_FIELD} ${UNINSTALLED_FIELD} ${FAILED_FIELD}`,
        '| fields - _span',
    ].join(' ');

export const yAxisTickInterval = (highest: number) =>
    SMALL_TICK_INTERVALS.find((interval) => highest <= interval * MAX_TICKS) ?? 'auto';

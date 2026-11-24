import {
    LATE_AFTER_INTERVALS,
    RECENT_PHONE_HOMES,
    SILENT_AFTER_INTERVALS,
} from './AgentDetails.constants';
import type { AgentSummary, PhoneHomeStatus } from './AgentDetails.types';

export const agentSummarySearch = (guid: string) =>
    [
        `| tstats latest(data.name) AS name latest(data.hostname) AS host latest(data.ip) AS ip latest(data.splunkVersion) AS version latest(data.build) AS build latest(data.utsname) AS os latest(data.package) AS package latest(data.packageType) AS packageType where index=_dsclient data.clientId="${guid}"`,
        `| appendcols [| tstats values(data.lastPhoneHomeTime) AS phoneHomes where index=_dsphonehome data.clientId="${guid}"]`,
        `| eval lastPhoneHome=tonumber(mvindex(phoneHomes, -1)), recent=mvindex(phoneHomes, -${RECENT_PHONE_HOMES}, -1)`,
        '| eval interval=if(mvcount(recent) > 1, round((tonumber(mvindex(recent, -1)) - tonumber(mvindex(recent, 0))) / (mvcount(recent) - 1)), null())',
        '| fields - phoneHomes recent',
    ].join(' ');

export const phoneHomeStatus = (
    { lastPhoneHome, interval }: AgentSummary,
    now: number,
): PhoneHomeStatus => {
    if (lastPhoneHome === undefined) {
        return 'none';
    }
    if (!interval) {
        return 'noInterval';
    }
    const intervalsSince = (now - lastPhoneHome) / interval;
    if (intervalsSince <= LATE_AFTER_INTERVALS) {
        return 'phoningHome';
    }
    return intervalsSince <= SILENT_AFTER_INTERVALS ? 'late' : 'silent';
};

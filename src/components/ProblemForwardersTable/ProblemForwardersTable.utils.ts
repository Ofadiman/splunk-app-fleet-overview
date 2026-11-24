import { ROW_LIMIT, TIEBREAKERS } from './ProblemForwardersTable.constants';
import type { ForwarderSort } from './ProblemForwardersTable.types';

const sortClause = ({ column, order }: ForwarderSort) =>
    [
        `${order === 'desc' ? '-' : '+'} ${column}`,
        ...TIEBREAKERS[column].map((tiebreaker) => `- ${tiebreaker}`),
        '+ name',
    ].join(' ');

export const problemForwardersSearch = (sort: ForwarderSort) =>
    [
        '| tstats max(_time) AS last where index=_dsappevent by data.clientId data.appName data.action data.result',
        `| eval failed_at=if('data.result'!="Ok", last, null())`,
        `| eval fixed_at=if('data.result'="Ok" AND 'data.action'!="Download", last, null())`,
        '| stats max(failed_at) AS failed_at max(fixed_at) AS fixed_at by data.clientId data.appName',
        '| where failed_at > coalesce(fixed_at, 0)',
        '| stats count AS failingApps by data.clientId',
        '| append [| tstats count where index=_dsappevent data.result!=Ok by _time span=1h data.clientId | stats count AS failingHours by data.clientId]',
        '| append [| tstats count AS reconnects where index=_dsclient by data.clientId]',
        '| append [| tstats latest(data.name) AS name latest(data.hostname) AS host latest(data.splunkVersion) AS version where index=_dsclient earliest=1 latest=now by data.clientId]',
        '| stats max(failingApps) AS failingApps max(failingHours) AS failingHours max(reconnects) AS reconnects first(name) AS name first(host) AS host first(version) AS version by data.clientId',
        '| fillnull value=0 failingApps failingHours reconnects',
        '| where failingApps > 0 OR failingHours > 0 OR reconnects > 0',
        '| eventstats count AS total',
        `| sort ${ROW_LIMIT} ${sortClause(sort)}`,
        '| rename data.clientId AS clientId',
        '| table clientId name host version failingApps failingHours reconnects total',
    ].join(' ');

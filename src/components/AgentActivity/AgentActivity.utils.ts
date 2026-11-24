import { APP_ACTIONS, ENTRY_LIMIT } from './AgentActivity.constants';
import type { ActivityEntry, AppAction, IdentityChange } from './AgentActivity.types';

export const agentActivitySearch = (guid: string) =>
    [
        `| tstats count where index=_dsappevent data.clientId="${guid}" NOT (data.action=Download data.result=Ok) by _time span=1s data.appName data.action data.result data.checksum data.failedReason`,
        '| rename data.appName AS app data.action AS action data.result AS result data.checksum AS checksum data.failedReason AS failedReason',
        `| eval group=app, key=action.":".result.":".checksum, kind="app"`,
        `| append [| tstats count where index=_dsclient data.clientId="${guid}" earliest=1 latest=now by _time span=1s data.name data.splunkVersion data.ip`,
        '| rename data.name AS name data.splunkVersion AS version data.ip AS ip',
        '| sort 0 _time',
        '| streamstats current=f window=1 last(name) AS previousName last(version) AS previousVersion last(ip) AS previousIp',
        `| eval group="reconnect", key=name.":".version.":".ip, kind="reconnect"]`,
        '| addinfo',
        `| where kind="app" OR (_time >= info_min_time AND _time <= if(info_max_time="+Infinity", now(), info_max_time))`,
        '| sort 0 _time',
        '| streamstats current=f window=1 global=false last(key) AS previousKey by group',
        '| eval starts=if(isnull(previousKey) OR key!=previousKey, 1, 0)',
        '| streamstats sum(starts) AS run by group',
        '| stats min(_time) AS first max(_time) AS last sum(count) AS times first(kind) AS kind first(app) AS app first(action) AS action first(result) AS result last(failedReason) AS reason first(name) AS name first(version) AS version first(ip) AS ip first(previousName) AS previousName first(previousVersion) AS previousVersion first(previousIp) AS previousIp by group run',
        `| eval reason=replace(reason, "^'(.*)'$", "\\1")`,
        `| eval reason=if(reason="", null(), reason)`,
        '| eventstats count AS total',
        `| sort ${ENTRY_LIMIT} - last`,
        '| fields - group run',
    ].join(' ');

export const appAction = (action?: string): AppAction | undefined =>
    APP_ACTIONS.find((known) => known === action);

export const identityChanges = (entry: ActivityEntry): IdentityChange[] =>
    (
        [
            ['name', entry.previousName, entry.name],
            ['version', entry.previousVersion, entry.version],
            ['ip', entry.previousIp, entry.ip],
        ] as const
    ).flatMap(([field, from, to]) => (from && to && from !== to ? [{ field, from, to }] : []));

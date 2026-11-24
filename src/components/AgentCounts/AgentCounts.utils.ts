export const agentCountsSearch = (guid: string) =>
    [
        `| tstats max(_time) AS last where index=_dsappevent data.clientId="${guid}" by data.appName data.action data.result`,
        `| eval failed_at=if('data.result'!="Ok", last, null())`,
        `| eval fixed_at=if('data.result'="Ok" AND 'data.action'!="Download", last, null())`,
        '| stats max(failed_at) AS failed_at max(fixed_at) AS fixed_at by data.appName',
        '| where failed_at > coalesce(fixed_at, 0)',
        '| stats count AS failingApps',
        `| appendcols [| tstats count where index=_dsappevent data.clientId="${guid}" data.result!=Ok by _time span=1h | stats count AS failingHours]`,
        `| appendcols [| tstats count AS reconnects where index=_dsclient data.clientId="${guid}"]`,
    ].join(' ');

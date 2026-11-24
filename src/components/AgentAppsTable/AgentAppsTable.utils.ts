export const agentAppsSearch = (guid: string) =>
    [
        `| tstats min(_time) AS first max(_time) AS last count where index=_dsappevent data.clientId="${guid}" by _time span=1h data.serverClassName data.appName data.action data.result data.failedReason`,
        '| rename data.serverClassName AS serverClass data.appName AS app data.action AS action data.result AS result data.failedReason AS failedReason',
        `| eval okAt=if(result="Ok" AND action!="Download", last, null())`,
        '| eventstats max(okAt) AS lastOkAt by serverClass app',
        '| eval okAction=if(okAt=lastOkAt, action, null())',
        `| eval failed=if(result!="Ok" AND last > coalesce(lastOkAt, 0), 1, 0)`,
        '| eval failedFirst=if(failed=1, first, null()), failedLast=if(failed=1, last, null())',
        '| eventstats max(failedLast) AS lastFailedAt by serverClass app',
        `| eval reason=if(failed=1 AND failedLast=lastFailedAt, replace(failedReason, "^'(.*)'$", "\\1"), null())`,
        '| stats max(lastOkAt) AS lastSuccess values(okAction) AS lastSuccessAction min(failedFirst) AS failingSince max(failedLast) AS lastFailure values(reason) AS reason by serverClass app',
        `| eval status=case(isnotnull(lastFailure), "failing", lastSuccessAction="Uninstall", "uninstalled", lastSuccessAction="Install", "installed", true(), "downloaded")`,
        `| eval reason=if(reason="", null(), mvindex(reason, 0))`,
        `| eval failingFirst=if(status="failing", 0, 1)`,
        '| sort 0 failingFirst app serverClass',
        '| table app serverClass status lastSuccess failingSince reason',
    ].join(' ');

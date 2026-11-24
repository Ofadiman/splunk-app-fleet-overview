import { COUNT_FIELD, MAX_TICKS, SMALL_TICK_INTERVALS } from './AgentPhoneHomesChart.constants';
import type { Span } from './AgentPhoneHomesChart.types';

export const agentPhoneHomesSearch = (guid: string, span: Span) =>
    [
        `| tstats prestats=t count where index=_dsphonehome data.clientId="${guid}" by _time span=${span}`,
        `| timechart span=${span} count AS ${COUNT_FIELD}`,
        `| fillnull value=0 ${COUNT_FIELD}`,
        '| addinfo',
        `| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)`,
        '| fields - _span info_*',
    ].join(' ');

export const yAxisTickInterval = (highest: number) =>
    SMALL_TICK_INTERVALS.find((interval) => highest <= interval * MAX_TICKS) ?? 'auto';

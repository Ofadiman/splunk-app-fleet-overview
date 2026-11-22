import {
    MAX_TICKS,
    RECONNECTS_FIELD,
    SMALL_TICK_INTERVALS,
} from './ForwarderReconnectsChart.constants';
import type { Span } from './ForwarderReconnectsChart.types';

export const forwarderReconnectsSearch = (span: Span) =>
    [
        `| tstats prestats=t count where index=_dsclient by _time span=${span}`,
        `| timechart span=${span} count AS ${RECONNECTS_FIELD}`,
        '| addinfo',
        `| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)`,
        '| fields - _span info_*',
    ].join(' ');

export const yAxisTickInterval = (highest: number) =>
    SMALL_TICK_INTERVALS.find((interval) => highest <= interval * MAX_TICKS) ?? 'auto';

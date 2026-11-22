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
        '| fields - _span',
    ].join(' ');

export const yAxisTickInterval = (highest: number) =>
    SMALL_TICK_INTERVALS.find((interval) => highest <= interval * MAX_TICKS) ?? 'auto';

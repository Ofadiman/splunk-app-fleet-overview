import { MAX_TICKS, SMALL_TICK_INTERVALS } from './ForwarderReconnectsChart.constants';

export const yAxisTickInterval = (highest: number) =>
    SMALL_TICK_INTERVALS.find((interval) => highest <= interval * MAX_TICKS) ?? 'auto';

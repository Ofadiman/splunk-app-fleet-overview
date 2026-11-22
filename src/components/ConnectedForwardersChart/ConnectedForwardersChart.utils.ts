import { CONNECTED_FIELD } from './ConnectedForwardersChart.constants';
import type { Span } from './ConnectedForwardersChart.types';

export const connectedForwardersSearch = (span: Span) =>
    [
        `| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=${span}`,
        `| timechart span=${span} dc(data.clientId) AS ${CONNECTED_FIELD}`,
        '| fields - _span',
    ].join(' ');

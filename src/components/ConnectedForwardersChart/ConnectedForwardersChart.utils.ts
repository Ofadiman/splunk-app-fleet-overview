import { CONNECTED_FIELD } from './ConnectedForwardersChart.constants';
import type { Span } from './ConnectedForwardersChart.types';

export const connectedForwardersSearch = (span: Span) =>
    [
        `| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=${span}`,
        `| timechart span=${span} dc(data.clientId) AS ${CONNECTED_FIELD}`,
        '| addinfo',
        `| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)`,
        '| fields - _span info_*',
    ].join(' ');

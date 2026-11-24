import type { UIEventHandler } from 'react';
import type { ChartTimeRange, TimeRange } from '../TimeRangeControls/TimeRangeControls.types';

export type ForwarderColumn = 'failingApps' | 'failingHours' | 'reconnects';

export type SortOrder = 'asc' | 'desc';

export type ForwarderSort = {
    column: ForwarderColumn;
    order: SortOrder;
};

export type ForwarderSearch = TimeRange & ForwarderSort;

export type ProblemForwardersTableProps = {
    timeRange: ChartTimeRange;
    sort: ForwarderSort;
    onSortChange: (sort: ForwarderSort) => void;
};

export type ProblemForwarder = Record<ForwarderColumn, number> & {
    clientId: string;
    name?: string;
    host?: string;
    version?: string;
};

export type ProblemForwarders = {
    forwarders: ProblemForwarder[];
    total: number;
};

export type ForwarderSortProps = Pick<
    ProblemForwardersTableProps,
    'timeRange' | 'sort' | 'onSortChange'
>;

export type ForwardersTableProps = ForwarderSortProps & {
    forwarders: ProblemForwarder[];
    onScroll?: UIEventHandler<HTMLDivElement>;
};

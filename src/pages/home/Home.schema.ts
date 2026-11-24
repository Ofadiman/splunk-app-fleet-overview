import { DEFAULT_FORWARDER_SORT } from '../../components/ProblemForwardersTable/ProblemForwardersTable.constants';
import {
    forwarderColumnSchema,
    sortOrderSchema,
} from '../../components/ProblemForwardersTable/ProblemForwardersTable.schema';
import { chartTimeRangeSearchSchema } from '../../components/TimeRangeControls/TimeRangeControls.schema';

export const homeSearchSchema = chartTimeRangeSearchSchema.extend({
    sort: forwarderColumnSchema
        .default(DEFAULT_FORWARDER_SORT.column)
        .catch(DEFAULT_FORWARDER_SORT.column),
    order: sortOrderSchema
        .default(DEFAULT_FORWARDER_SORT.order)
        .catch(DEFAULT_FORWARDER_SORT.order),
});

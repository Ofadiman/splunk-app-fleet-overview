import { z } from 'zod';
import { DEFAULT_FORWARDER_SORT } from '../../components/ProblemForwardersTable/ProblemForwardersTable.constants';
import {
    forwarderColumnSchema,
    sortOrderSchema,
} from '../../components/ProblemForwardersTable/ProblemForwardersTable.schema';
import { DEFAULT_TIME_RANGE } from '../../components/TimeRangeControls/TimeRangeControls.constants';
import { resolutionSchema } from '../../components/TimeRangeControls/TimeRangeControls.schema';

export const overviewSearchSchema = z.object({
    earliest: z
        .union([z.string(), z.number().transform((value) => String(value))])
        .default(DEFAULT_TIME_RANGE.earliest)
        .catch(DEFAULT_TIME_RANGE.earliest),
    latest: z
        .union([z.string(), z.number().transform((value) => String(value))])
        .default(DEFAULT_TIME_RANGE.latest)
        .catch(DEFAULT_TIME_RANGE.latest),
    resolution: resolutionSchema
        .default(DEFAULT_TIME_RANGE.resolution)
        .catch(DEFAULT_TIME_RANGE.resolution),
    sort: forwarderColumnSchema
        .default(DEFAULT_FORWARDER_SORT.column)
        .catch(DEFAULT_FORWARDER_SORT.column),
    order: sortOrderSchema
        .default(DEFAULT_FORWARDER_SORT.order)
        .catch(DEFAULT_FORWARDER_SORT.order),
});

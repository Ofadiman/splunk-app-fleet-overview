import { z } from 'zod';
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
});

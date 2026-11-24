import { z } from 'zod';
import { AUTO_RESOLUTION, DEFAULT_TIME_RANGE, SPANS } from './TimeRangeControls.constants';

export const resolutionSchema = z.enum([AUTO_RESOLUTION, ...SPANS]);

const timeSchema = (fallback: string) =>
    z
        .union([z.string(), z.number().transform((value) => String(value))])
        .default(fallback)
        .catch(fallback);

export const chartTimeRangeSearchSchema = z.object({
    earliest: timeSchema(DEFAULT_TIME_RANGE.earliest),
    latest: timeSchema(DEFAULT_TIME_RANGE.latest),
    resolution: resolutionSchema
        .default(DEFAULT_TIME_RANGE.resolution)
        .catch(DEFAULT_TIME_RANGE.resolution),
});

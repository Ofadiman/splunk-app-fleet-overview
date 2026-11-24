import { z } from 'zod';
import { chartTimeRangeSearchSchema } from '../../components/TimeRangeControls/TimeRangeControls.schema';

export const agentsSearchSchema = chartTimeRangeSearchSchema.extend({
    guid: z.string().optional().catch(undefined),
});

export const agentGuidSchema = z.guid();

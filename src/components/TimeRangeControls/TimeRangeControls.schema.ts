import { z } from 'zod';
import { AUTO_RESOLUTION, SPANS } from './TimeRangeControls.constants';

export const resolutionSchema = z.enum([AUTO_RESOLUTION, ...SPANS]);

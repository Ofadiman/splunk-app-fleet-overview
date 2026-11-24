import { z } from 'zod';

const count = z.coerce.number().int().nonnegative().default(0);

export const agentCountsResultsSchema = z
    .object({
        results: z
            .array(
                z.object({
                    failingApps: count,
                    failingHours: count,
                    reconnects: count,
                }),
            )
            .default([]),
    })
    .transform(({ results }) => results[0] ?? { failingApps: 0, failingHours: 0, reconnects: 0 });

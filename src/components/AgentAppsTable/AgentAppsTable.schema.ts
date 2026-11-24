import { z } from 'zod';
import { APP_STATUSES } from './AgentAppsTable.constants';

const seconds = z.coerce.number().optional();

export const agentAppsResultsSchema = z
    .object({
        results: z
            .array(
                z.object({
                    app: z.string(),
                    serverClass: z.string(),
                    status: z.enum(APP_STATUSES),
                    lastSuccess: seconds,
                    failingSince: seconds,
                    reason: z.string().optional(),
                }),
            )
            .default([]),
    })
    .transform(({ results }) => results);

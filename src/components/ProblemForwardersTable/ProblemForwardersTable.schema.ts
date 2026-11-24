import { z } from 'zod';
import { FORWARDER_COLUMNS, SORT_ORDERS } from './ProblemForwardersTable.constants';

export const forwarderColumnSchema = z.enum(FORWARDER_COLUMNS);

export const sortOrderSchema = z.enum(SORT_ORDERS);

const count = z.coerce.number().int().nonnegative();

export const searchResultsSchema = z
    .object({
        results: z
            .array(
                z.object({
                    clientId: z.string(),
                    name: z.string().optional(),
                    host: z.string().optional(),
                    version: z.string().optional(),
                    failingApps: count,
                    failingHours: count,
                    reconnects: count,
                    total: count,
                }),
            )
            .default([]),
    })
    .transform(({ results }) => ({
        forwarders: results,
        total: results[0]?.total ?? 0,
    }));

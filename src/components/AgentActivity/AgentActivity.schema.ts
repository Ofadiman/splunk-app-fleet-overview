import { z } from 'zod';

const text = z.string().optional();

const number = z.coerce.number();

export const agentActivityResultsSchema = z
    .object({
        results: z
            .array(
                z.object({
                    kind: z.enum(['app', 'reconnect']),
                    first: number,
                    last: number,
                    times: number,
                    app: text,
                    action: text,
                    result: text,
                    reason: text,
                    name: text,
                    version: text,
                    ip: text,
                    previousName: text,
                    previousVersion: text,
                    previousIp: text,
                    total: number,
                }),
            )
            .default([]),
    })
    .transform(({ results }) => ({
        entries: results.map(({ total: _total, ...entry }) => entry),
        total: results[0]?.total ?? 0,
    }));

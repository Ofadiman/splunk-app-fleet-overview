import { z } from 'zod';

const text = z.string().optional();

const seconds = z.coerce.number().optional();

export const agentSummaryResultsSchema = z
    .object({
        results: z
            .array(
                z.object({
                    name: text,
                    host: text,
                    ip: text,
                    version: text,
                    build: text,
                    os: text,
                    package: text,
                    packageType: text,
                    lastPhoneHome: seconds,
                    interval: seconds,
                }),
            )
            .default([]),
    })
    .transform(({ results }) => results[0] ?? null);

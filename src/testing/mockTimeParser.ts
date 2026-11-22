import { vi } from 'vitest';

export const HOUR_SECONDS = 3_600;

export const DAY_SECONDS = 24 * HOUR_SECONDS;

const LATEST_EPOCH = 1_795_305_600;

export const mockTimeParser = (durations: Partial<Record<string, number>> = {}) =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const [earliest = '', latest = ''] = new URL(
            String(input),
            'http://localhost',
        ).searchParams.getAll('time');
        const duration = durations[earliest] ?? DAY_SECONDS;
        const parsed = {
            [earliest]: String(LATEST_EPOCH - duration),
            [latest]: String(LATEST_EPOCH),
        };

        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    });

export const mockTimeParserError = (text: string) =>
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ messages: [{ type: 'FATAL', text }] }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }),
    );

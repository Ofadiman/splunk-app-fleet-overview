import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { TimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import AgentCounts from './AgentCounts';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const timeRange: TimeRange = { earliest: '-24h@h', latest: 'now' };

const searchResults = (row: Record<string, string>) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: [],
    results: [row],
});

const renderCounts = () => renderWithQueryClient(<AgentCounts guid={guid} timeRange={timeRange} />);

const countOf = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AgentCounts', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderCounts();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(
            screen.getByRole('heading', { level: 2, name: 'Problems in this time range' }),
        ).toBeVisible();
        expect(screen.getByText('Loading the counts')).toBeInTheDocument();
    });

    it('shows the failing apps, failing hours and reconnects of the agent', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults({ failingApps: '1', failingHours: '24', reconnects: '122' }),
        );

        renderCounts();

        await waitFor(() => expect(countOf('Failing apps')).toBe('1'));
        expect(countOf('Failing hours')).toBe('24');
        expect(countOf('Reconnects')).toBe('122');
    });

    it('shows zeros when the agent had no problems', async () => {
        vi.mocked(oneShot).mockResolvedValue({ results: [] });

        renderCounts();

        await waitFor(() => expect(countOf('Failing apps')).toBe('0'));
        const list = screen.getByText('Failing apps').closest('dl') as HTMLElement;
        expect(within(list).getAllByText('0')).toHaveLength(3);
    });

    it('searches only this agent in the time range', async () => {
        vi.mocked(oneShot).mockResolvedValue({ results: [] });

        renderCounts();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(`index=_dsclient data.clientId="${guid}"`),
                earliest_time: '-24h@h',
                latest_time: 'now',
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(
                searchResults({ failingApps: '0', failingHours: '0', reconnects: '3' }),
            );

        renderCounts();

        expect(await screen.findByText('Couldn’t load the counts')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(countOf('Reconnects')).toBe('3'));
    });
});

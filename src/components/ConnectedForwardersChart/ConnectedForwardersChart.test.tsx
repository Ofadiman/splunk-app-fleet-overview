import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Line from '@splunk/visualizations/Line';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import ConnectedForwardersChart from './ConnectedForwardersChart';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Line', () => ({ default: vi.fn(() => null) }));

const searchResults = (times: string[], counts: string[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', 'connected'],
    columns: [times, counts],
});

const chartData = () => vi.mocked(Line).mock.lastCall?.[0].dataSources.primary.data;

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ConnectedForwardersChart', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
        vi.mocked(Line).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderWithQueryClient(<ConnectedForwardersChart />);

        expect(
            screen.getByRole('heading', { level: 2, name: 'Connected forwarders' }),
        ).toBeVisible();
        expect(screen.getByText('Loading connected forwarders')).toBeInTheDocument();
    });

    it('draws the number of connected forwarders per minute', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-13T10:11:00.000+00:00', '2026-11-13T10:12:00.000+00:00'],
                ['5', '4'],
            ),
        );

        renderWithQueryClient(<ConnectedForwardersChart />);

        await waitFor(() =>
            expect(chartData()).toEqual({
                fields: ['_time', 'Connected forwarders'],
                columns: [
                    ['2026-11-13T10:11:00.000+00:00', '2026-11-13T10:12:00.000+00:00'],
                    ['5', '4'],
                ],
            }),
        );
        expect(screen.queryByText('Loading connected forwarders')).not.toBeInTheDocument();
    });

    it('tells when no forwarder phoned home', async () => {
        vi.mocked(oneShot).mockResolvedValue({ fields: [], columns: [] });

        renderWithQueryClient(<ConnectedForwardersChart />);

        expect(
            await screen.findByText('No forwarder phoned home in the last 60 minutes'),
        ).toBeInTheDocument();
        expect(Line).not.toHaveBeenCalled();
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderWithQueryClient(<ConnectedForwardersChart />);

        expect(await screen.findByText('Couldn’t load connected forwarders')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2026-11-13T10:11:00.000+00:00'], ['5']));

        renderWithQueryClient(<ConnectedForwardersChart />);
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(chartData()?.columns[1]).toEqual(['5']));
        expect(screen.queryByText('Couldn’t load connected forwarders')).not.toBeInTheDocument();
    });
});

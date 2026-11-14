import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Column from '@splunk/visualizations/Column';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import ForwarderReconnectsChart from './ForwarderReconnectsChart';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Column', () => ({ default: vi.fn(() => null) }));

const searchResults = (times: string[], counts: string[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', 'reconnects'],
    columns: [times, counts],
});

const chartData = () => vi.mocked(Column).mock.lastCall?.[0].dataSources.primary.data;

const chartOptions = () => vi.mocked(Column).mock.lastCall?.[0].options;

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ForwarderReconnectsChart', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
        vi.mocked(Column).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderWithQueryClient(<ForwarderReconnectsChart />);

        expect(
            screen.getByRole('heading', { level: 2, name: 'Forwarder reconnects' }),
        ).toBeVisible();
        expect(screen.getByText('Loading forwarder reconnects')).toBeInTheDocument();
    });

    it('draws the number of reconnects per minute', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                ['3', '0'],
            ),
        );

        renderWithQueryClient(<ForwarderReconnectsChart />);

        await waitFor(() =>
            expect(chartData()).toEqual({
                fields: ['_time', 'Reconnects'],
                columns: [
                    ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                    ['3', '0'],
                ],
            }),
        );
        expect(screen.queryByText('Loading forwarder reconnects')).not.toBeInTheDocument();
    });

    it('marks the y-axis in whole reconnects when there are few', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                ['2', '0'],
            ),
        );

        renderWithQueryClient(<ForwarderReconnectsChart />);

        await waitFor(() => expect(chartOptions()?.yAxisMajorTickInterval).toBe(1));
    });

    it('lets the chart space the y-axis marks when there are many reconnects', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                ['40', '6'],
            ),
        );

        renderWithQueryClient(<ForwarderReconnectsChart />);

        await waitFor(() => expect(chartOptions()?.yAxisMajorTickInterval).toBe('auto'));
    });

    it('tells when no forwarder reconnected', async () => {
        vi.mocked(oneShot).mockResolvedValue({ fields: [], columns: [] });

        renderWithQueryClient(<ForwarderReconnectsChart />);

        expect(
            await screen.findByText('No forwarder reconnected in the last 60 minutes'),
        ).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderWithQueryClient(<ForwarderReconnectsChart />);

        expect(await screen.findByText('Couldn’t load forwarder reconnects')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2026-11-14T18:18:00.000+00:00'], ['3']));

        renderWithQueryClient(<ForwarderReconnectsChart />);
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(chartData()?.columns[1]).toEqual(['3']));
        expect(screen.queryByText('Couldn’t load forwarder reconnects')).not.toBeInTheDocument();
    });
});

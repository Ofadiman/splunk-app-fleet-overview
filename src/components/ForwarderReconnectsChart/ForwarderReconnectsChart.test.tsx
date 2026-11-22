import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Column from '@splunk/visualizations/Column';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
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

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ForwarderReconnectsChart', () => {
    beforeEach(() => {
        mockTimeParser();
        vi.mocked(oneShot).mockReset();
        vi.mocked(Column).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(
            screen.getByRole('heading', { level: 2, name: 'Forwarder reconnects' }),
        ).toBeVisible();
        expect(
            screen.getByText(
                'Number of times forwarders connected to the deployment server after they started or restarted in each interval',
            ),
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

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

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

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

        await waitFor(() => expect(chartOptions()?.yAxisMajorTickInterval).toBe(1));
    });

    it('marks the y-axis in pairs of reconnects when there are up to ten', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                ['7', '0'],
            ),
        );

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

        await waitFor(() => expect(chartOptions()?.yAxisMajorTickInterval).toBe(2));
    });

    it('lets the chart space the y-axis marks when there are many reconnects', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(
                ['2026-11-14T18:18:00.000+00:00', '2026-11-14T18:19:00.000+00:00'],
                ['40', '6'],
            ),
        );

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

        await waitFor(() => expect(chartOptions()?.yAxisMajorTickInterval).toBe('auto'));
    });

    it('tells when no forwarder reconnected', async () => {
        vi.mocked(oneShot).mockResolvedValue({ fields: [], columns: [] });

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

        expect(
            await screen.findByText('No forwarder reconnected in this time range'),
        ).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);

        expect(await screen.findByText('Couldn’t load forwarder reconnects')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2026-11-14T18:18:00.000+00:00'], ['3']));

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(chartData()?.columns[1]).toEqual(['3']));
        expect(screen.queryByText('Couldn’t load forwarder reconnects')).not.toBeInTheDocument();
    });

    it('searches the time range in buckets of the chosen resolution', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(['2026-11-13T10:00:00.000+00:00'], ['2']),
        );

        renderWithQueryClient(<ForwarderReconnectsChart timeRange={timeRange} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining('timechart span=1h count AS reconnects'),
                earliest_time: '-24h@h',
                latest_time: 'now',
                count: 0,
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });
});

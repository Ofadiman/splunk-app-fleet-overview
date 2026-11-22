import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Line from '@splunk/visualizations/Line';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY_SECONDS, mockTimeParser, mockTimeParserError } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
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

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ConnectedForwardersChart', () => {
    beforeEach(() => {
        mockTimeParser();
        vi.mocked(oneShot).mockReset();
        vi.mocked(Line).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

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

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

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

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

        expect(
            await screen.findByText('No forwarder phoned home in this time range'),
        ).toBeInTheDocument();
        expect(Line).not.toHaveBeenCalled();
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

        expect(await screen.findByText('Couldn’t load connected forwarders')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2026-11-13T10:11:00.000+00:00'], ['5']));

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(chartData()?.columns[1]).toEqual(['5']));
        expect(screen.queryByText('Couldn’t load connected forwarders')).not.toBeInTheDocument();
    });

    it('searches the time range in buckets of the chosen resolution', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(['2026-11-13T10:00:00.000+00:00'], ['5']),
        );

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

        expect(await screen.findByText('Per hour')).toBeVisible();
        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining('by _time span=1h'),
                earliest_time: '-24h@h',
                latest_time: 'now',
                count: 0,
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('picks the resolution for Auto from the length of the time range', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(['2026-11-13T10:00:00.000+00:00'], ['5']),
        );

        renderWithQueryClient(
            <ConnectedForwardersChart timeRange={{ ...timeRange, resolution: 'auto' }} />,
        );

        expect(await screen.findByText('Per 15 minutes')).toBeVisible();
        expect(vi.mocked(oneShot).mock.lastCall?.[0].search).toContain('timechart span=15m');
    });

    it('uses Auto when the resolution gives too many points for the time range', async () => {
        mockTimeParser({ '-7d@h': 7 * DAY_SECONDS });
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(['2026-11-13T00:00:00.000+00:00'], ['5']),
        );

        renderWithQueryClient(
            <ConnectedForwardersChart
                timeRange={{ earliest: '-7d@h', latest: 'now', resolution: '1m' }}
            />,
        );

        expect(await screen.findByText('Per 6 hours')).toBeVisible();
        expect(vi.mocked(oneShot).mock.lastCall?.[0].search).toContain('span=6h');
    });

    it('shows the error when Splunk can’t read the time range', async () => {
        silenceErrorBoundaryLogs();
        mockTimeParserError('Invalid time.');

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

        expect(await screen.findByText('Couldn’t load connected forwarders')).toBeInTheDocument();
        expect(screen.getByText('Invalid time.')).toBeInTheDocument();
        expect(oneShot).not.toHaveBeenCalled();
    });

    it('leaves out the buckets that the time range only partly covers', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults(['2026-11-13T10:00:00.000+00:00'], ['5']),
        );

        renderWithQueryClient(<ConnectedForwardersChart timeRange={timeRange} />);

        await waitFor(() =>
            expect(vi.mocked(oneShot).mock.lastCall?.[0].search).toContain(
                '| addinfo | where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)',
            ),
        );
    });
});

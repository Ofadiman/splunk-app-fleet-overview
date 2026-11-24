import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Column from '@splunk/visualizations/Column';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import AgentReconnectsChart from './AgentReconnectsChart';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Column', () => ({ default: vi.fn(() => null) }));

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const hours = ['2026-11-24T09:00:00.000+00:00', '2026-11-24T10:00:00.000+00:00'];

const searchResults = (counts: string[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', 'reconnects'],
    columns: [hours, counts],
});

const chartProps = () => vi.mocked(Column).mock.lastCall?.[0];

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const renderChart = () =>
    renderWithQueryClient(<AgentReconnectsChart guid={guid} timeRange={timeRange} />);

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AgentReconnectsChart', () => {
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

        renderChart();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 2, name: 'Reconnects' })).toBeVisible();
        expect(
            screen.getByText(
                'Number of times this agent connected to the deployment server after it started or restarted in each interval',
            ),
        ).toBeVisible();
        expect(screen.getByText('Loading reconnects')).toBeInTheDocument();
    });

    it('draws the count of each interval', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['1', '0']));

        renderChart();

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data).toEqual({
                fields: ['_time', 'Reconnects'],
                columns: [hours, ['1', '0']],
            }),
        );
        expect(chartProps()?.options?.yAxisMajorTickInterval).toBe(1);
    });

    it('tells when every interval is empty', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['0', '0']));

        renderChart();

        expect(await screen.findByText('No reconnects in this time range')).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('tells when the search finds nothing', async () => {
        vi.mocked(oneShot).mockResolvedValue({ fields: [], columns: [] });

        renderChart();

        expect(await screen.findByText('No reconnects in this time range')).toBeInTheDocument();
    });

    it('searches only this agent in buckets of the chosen resolution', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['1', '0']));

        renderChart();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(
                    `index=_dsclient data.clientId="${guid}" by _time span=1h`,
                ),
                earliest_time: '-24h@h',
                latest_time: 'now',
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderChart();

        expect(await screen.findByText('Couldn’t load reconnects')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2', '1']));

        renderChart();
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data.columns[1]).toEqual(['2', '1']),
        );
    });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import Column from '@splunk/visualizations/Column';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import DeploymentActivityChart from './DeploymentActivityChart';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Column', () => ({ default: vi.fn(() => null) }));

const minutes = ['2026-11-14T18:16:00.000+00:00', '2026-11-14T18:17:00.000+00:00'];

const searchResults = (installed: string[], uninstalled: string[], failed: string[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', 'installed', 'uninstalled', 'failed'],
    columns: [minutes, installed, uninstalled, failed],
});

const chartProps = () => vi.mocked(Column).mock.lastCall?.[0];

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('DeploymentActivityChart', () => {
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

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(
            screen.getByRole('heading', { level: 2, name: 'Deployment activity' }),
        ).toBeVisible();
        expect(
            screen.getByText(
                'Number of forwarders that installed, uninstalled or failed to deploy an app in each interval',
            ),
        ).toBeVisible();
        expect(screen.getByText('Loading deployment activity')).toBeInTheDocument();
    });

    it('draws the forwarders that installed, uninstalled or failed per minute', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['0', '1'], ['2', '0'], ['1', '1']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data).toEqual({
                fields: ['_time', 'Installed', 'Uninstalled', 'Failed'],
                columns: [minutes, ['0', '1'], ['2', '0'], ['1', '1']],
            }),
        );
        expect(chartProps()?.options?.stackMode).toBe('stacked');
        expect(screen.queryByText('Loading deployment activity')).not.toBeInTheDocument();
    });

    it('gives each outcome its own hex color', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['0', '1'], ['2', '0'], ['1', '1']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        await waitFor(() => expect(chartProps()).toBeDefined());
        const colors = chartProps()?.options?.seriesColorsByField;
        expect(Object.keys(colors)).toEqual(['Installed', 'Uninstalled', 'Failed']);
        expect(new Set(Object.values(colors)).size).toBe(3);
        Object.values(colors).forEach((color) => expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/));
    });

    it('marks the y-axis in whole forwarders when there are few', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['0', '1'], ['2', '0'], ['1', '1']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        await waitFor(() => expect(chartProps()?.options?.yAxisMajorTickInterval).toBe(1));
    });

    it('marks the y-axis in pairs of forwarders when up to ten take part', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['5', '0'], ['0', '2'], ['1', '0']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        await waitFor(() => expect(chartProps()?.options?.yAxisMajorTickInterval).toBe(2));
    });

    it('lets the chart space the y-axis marks when many forwarders take part', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['40', '3'], ['0', '0'], ['2', '0']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        await waitFor(() => expect(chartProps()?.options?.yAxisMajorTickInterval).toBe('auto'));
    });

    it('tells when the search finds no app events', async () => {
        vi.mocked(oneShot).mockResolvedValue({ fields: [], columns: [] });

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        expect(
            await screen.findByText('No app deployments in this time range'),
        ).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('tells when no forwarder installed, uninstalled or failed in any minute', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['0', '0'], ['0', '0'], ['0', '0']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        expect(
            await screen.findByText('No app deployments in this time range'),
        ).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);

        expect(await screen.findByText('Couldn’t load deployment activity')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['5', '0'], ['0', '0'], ['0', '0']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data.columns[1]).toEqual(['5', '0']),
        );
        expect(screen.queryByText('Couldn’t load deployment activity')).not.toBeInTheDocument();
    });

    it('searches the time range in buckets of the chosen resolution', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults(['5', '0'], ['0', '2'], ['0', '1']));

        renderWithQueryClient(<DeploymentActivityChart timeRange={timeRange} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringMatching(/by _time span=1h data\.clientId.*timechart span=1h/),
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

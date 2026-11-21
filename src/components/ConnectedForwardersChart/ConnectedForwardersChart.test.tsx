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

const minutes = [
    '2026-11-14T18:16:00.000+00:00',
    '2026-11-14T18:17:00.000+00:00',
    '2026-11-14T18:18:00.000+00:00',
];

type Columns = Record<string, string[]>;

const minuteResults = (columns: Columns) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', ...Object.keys(columns)],
    columns: [minutes, ...Object.values(columns)],
});

type IndexResults = Columns | Error | 'pending';

const mockSearches = (byIndex: Record<string, IndexResults>) => {
    vi.mocked(oneShot).mockImplementation(({ search }) => {
        const index = Object.keys(byIndex).find((name) => String(search).includes(`index=${name}`));
        const results = index ? byIndex[index] : new Error(`Unexpected search: ${search}`);

        if (results === 'pending') {
            return new Promise(() => {});
        }

        return results instanceof Error
            ? Promise.reject(results)
            : Promise.resolve(minuteResults(results));
    });
};

const noDeployments = {
    installed: ['0', '0', '0'],
    uninstalled: ['0', '0', '0'],
    failed: ['0', '0', '0'],
};

const markerData = () => vi.mocked(Line).mock.lastCall?.[0].dataSources.annotation?.data;

const lineOptions = () => vi.mocked(Line).mock.lastCall?.[0].options;

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

    describe('markers', () => {
        it('marks the minutes when forwarders installed, uninstalled, failed or reconnected', async () => {
            mockSearches({
                _dsphonehome: { connected: ['5', '5', '3'] },
                _dsappevent: {
                    installed: ['5', '0', '0'],
                    uninstalled: ['0', '2', '0'],
                    failed: ['0', '1', '0'],
                },
                _dsclient: { reconnects: ['0', '0', '2'] },
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(markerData()?.columns[0]).toEqual(minutes));
            expect(markerData()?.columns[1]).toEqual([
                'Installed: 5',
                'Uninstalled: 2, Failed: 1',
                'Reconnects: 2',
            ]);
            expect(lineOptions()?.annotationX).toBe('> annotation|seriesByIndex(0)');
        });

        it('colors the minutes when forwarders start failing', async () => {
            mockSearches({
                _dsphonehome: { connected: ['5', '5', '5'] },
                _dsappevent: {
                    installed: ['5', '0', '0'],
                    uninstalled: ['0', '0', '0'],
                    failed: ['0', '1', '0'],
                },
                _dsclient: { reconnects: ['0', '0', '2'] },
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(markerData()?.columns[2]).toHaveLength(3));
            const [installColor, failureColor, reconnectColor] = markerData()?.columns[2] ?? [];
            expect(failureColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(installColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(failureColor).not.toBe(installColor);
            expect(reconnectColor).toBe(installColor);
        });

        it('marks a forwarder that keeps failing only in the minute it starts', async () => {
            mockSearches({
                _dsphonehome: { connected: ['5', '5', '5'] },
                _dsappevent: { ...noDeployments, failed: ['1', '1', '1'] },
                _dsclient: { reconnects: ['0', '0', '0'] },
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(markerData()?.columns[0]).toEqual([minutes[0]]));
            expect(markerData()?.columns[1]).toEqual(['Failed: 1']);
        });

        it('skips the minutes when fewer than 1 in 100 connected forwarders take part', async () => {
            mockSearches({
                _dsphonehome: { connected: ['1000', '1000', '1000'] },
                _dsappevent: noDeployments,
                _dsclient: { reconnects: ['5', '20', '0'] },
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(markerData()?.columns[0]).toEqual([minutes[1]]));
            expect(markerData()?.columns[1]).toEqual(['Reconnects: 20']);
        });

        it('draws the line without markers while their searches run', async () => {
            mockSearches({
                _dsphonehome: { connected: ['5', '5', '5'] },
                _dsappevent: 'pending',
                _dsclient: 'pending',
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(chartData()?.columns[1]).toEqual(['5', '5', '5']));
            expect(markerData()).toBeUndefined();
            expect(lineOptions()?.annotationX).toBeUndefined();
        });

        it('draws the line without markers when their searches fail', async () => {
            mockSearches({
                _dsphonehome: { connected: ['5', '5', '5'] },
                _dsappevent: new Error('Search job quota exceeded'),
                _dsclient: new Error('Search job quota exceeded'),
            });

            renderWithQueryClient(<ConnectedForwardersChart />);

            await waitFor(() => expect(chartData()?.columns[1]).toEqual(['5', '5', '5']));
            await waitFor(() => expect(oneShot).toHaveBeenCalledTimes(3));
            expect(markerData()).toBeUndefined();
            expect(
                screen.queryByText('Couldn’t load connected forwarders'),
            ).not.toBeInTheDocument();
        });
    });
});

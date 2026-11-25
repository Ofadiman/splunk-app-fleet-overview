import { expectBoundaryError } from '../../testing/expectBoundaryError';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { searchMock as oneShot } from '../../testing/SearchMock';
import { columnMock as Column } from '../../testing/ColumnMock';
import { restoreAllMocks } from '@vitest/spy';
import { afterEach, beforeEach, describe, expect, it } from '#component-tests';
import { mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import AgentPhoneHomesChart from './AgentPhoneHomesChart';

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const hours = ['2026-11-24T09:00:00.000+00:00', '2026-11-24T10:00:00.000+00:00'];

const searchResults = (counts: string[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: ['_time', 'phoneHomes'],
    columns: [hours, counts],
});

const chartProps = () => Column.mock.lastCall?.[0];

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const renderChart = () =>
    renderWithQueryClient(<AgentPhoneHomesChart guid={guid} timeRange={timeRange} />);

describe('AgentPhoneHomesChart', () => {
    beforeEach(() => {
        mockTimeParser();
        oneShot.mockReset();
        Column.mockClear();
    });

    afterEach(() => {
        restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        oneShot.mockReturnValue(new Promise(() => {}));

        renderChart();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 2, name: 'Phone homes' })).toBeVisible();
        expect(
            screen.getByText(
                'Number of times this agent phoned home to the deployment server in each interval',
            ),
        ).toBeVisible();
        expect(screen.getByText('Loading phone homes')).toBeInTheDocument();
    });

    it('draws the count of each interval', async () => {
        oneShot.mockResolvedValue(searchResults(['1', '0']));

        renderChart();

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data).toEqual({
                fields: ['_time', 'Phone homes'],
                columns: [hours, ['1', '0']],
            }),
        );
        expect(chartProps()?.options?.yAxisMajorTickInterval).toBe(1);
    });

    it('tells when every interval is empty', async () => {
        oneShot.mockResolvedValue(searchResults(['0', '0']));

        renderChart();

        expect(await screen.findByText('No phone homes in this time range')).toBeInTheDocument();
        expect(Column).not.toHaveBeenCalled();
    });

    it('tells when the search finds nothing', async () => {
        oneShot.mockResolvedValue({ fields: [], columns: [] });

        renderChart();

        expect(await screen.findByText('No phone homes in this time range')).toBeInTheDocument();
    });

    it('searches only this agent in buckets of the chosen resolution', async () => {
        oneShot.mockResolvedValue(searchResults(['1', '0']));

        renderChart();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(
                    `index=_dsphonehome data.clientId="${guid}" by _time span=1h`,
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
        expectBoundaryError('Search job quota exceeded');
        oneShot.mockRejectedValue(new Error('Search job quota exceeded'));

        renderChart();

        expect(await screen.findByText('Couldn’t load phone homes')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        expectBoundaryError('Search job quota exceeded');
        oneShot
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults(['2', '1']));

        renderChart();
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() =>
            expect(chartProps()?.dataSources.primary.data.columns[1]).toEqual(['2', '1']),
        );
    });
});

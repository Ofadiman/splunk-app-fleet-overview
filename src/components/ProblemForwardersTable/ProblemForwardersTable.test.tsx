import { useState } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { TimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import ProblemForwardersTable from './ProblemForwardersTable';
import type { ForwarderSort } from './ProblemForwardersTable.types';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));

const timeRange: TimeRange = { earliest: '-24h@h', latest: 'now' };

const stuck = {
    clientId: '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C',
    name: 'triss',
    host: 'triss.splunk.com',
    version: '10.0.7',
    failingApps: '1',
    failingHours: '24',
    reconnects: '2',
};

const crashing = {
    clientId: '9AFF545B-0AC6-4062-95CF-BDD989C175D6',
    name: 'vesemir',
    host: 'vesemir.splunk.com',
    version: '10.2.4',
    failingApps: '0',
    failingHours: '0',
    reconnects: '121',
};

const searchResults = (rows: Record<string, string>[], total = rows.length) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: [],
    results: rows.map((row) => ({ ...row, total: String(total) })),
});

const renderTable = (sort: ForwarderSort = { column: 'failingApps', order: 'desc' }) => {
    const onSortChange = vi.fn();
    renderWithQueryClient(
        <ProblemForwardersTable timeRange={timeRange} sort={sort} onSortChange={onSortChange} />,
    );
    return { onSortChange };
};

const SortableTable = () => {
    const [sort, setSort] = useState<ForwarderSort>({ column: 'failingApps', order: 'desc' });
    return <ProblemForwardersTable timeRange={timeRange} sort={sort} onSortChange={setSort} />;
};

const columnHeader = (label: string) =>
    screen.getByRole('columnheader', { name: new RegExp(`^${label}`) });

const sortButton = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });

const bodyRows = () => screen.getAllByRole('row').slice(1);

const cellTexts = (row: HTMLElement) =>
    within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent);

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ProblemForwardersTable', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the column headings and a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderTable();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 2, name: 'Problem forwarders' })).toBeVisible();
        expect(
            screen.getByText(
                'Forwarders that failed to deploy an app or reconnected in this time range',
            ),
        ).toBeVisible();
        ['Forwarder', 'Host', 'Version', 'Failing apps', 'Failing hours', 'Reconnects'].forEach(
            (label) => expect(columnHeader(label)).toBeVisible(),
        );
        expect(screen.getByText('Loading problem forwarders')).toBeInTheDocument();
    });

    it('explains what each count means in its heading', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderTable();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(sortButton('Failing apps')).toHaveAccessibleDescription(
            'Apps whose last deployment in this time range failed',
        );
        expect(sortButton('Failing hours')).toHaveAccessibleDescription(
            'Hours in which at least one app failed to deploy',
        );
        expect(sortButton('Reconnects')).toHaveAccessibleDescription(
            'Times the forwarder connected to the deployment server again',
        );
    });

    it('lists each forwarder with its failing apps, failing hours and reconnects', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable();

        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        expect(bodyRows().map(cellTexts)).toEqual([
            ['triss', 'triss.splunk.com', '10.0.7', '1', '24', '2'],
            ['vesemir', 'vesemir.splunk.com', '10.2.4', '0', '0', '121'],
        ]);
        expect(screen.queryByText('Loading problem forwarders')).not.toBeInTheDocument();
    });

    it('shows a dash for a name, host or version that the search doesn’t know', async () => {
        vi.mocked(oneShot).mockResolvedValue(
            searchResults([
                { clientId: stuck.clientId, failingApps: '1', failingHours: '3', reconnects: '0' },
            ]),
        );

        renderTable();

        await waitFor(() => expect(bodyRows()).toHaveLength(1));
        expect(cellTexts(bodyRows()[0])).toEqual(['—', '—', '—', '1', '3', '0']);
    });

    it('says it shows every forwarder when the search found no more', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable();

        expect(await screen.findByText('Showing all 2 forwarders')).toBeInTheDocument();
    });

    it('says it shows the only forwarder when the search found one', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck]));

        renderTable();

        expect(await screen.findByText('Showing 1 forwarder')).toBeInTheDocument();
    });

    it('says how many forwarders the search found when it shows only the top ones', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing], 515));

        renderTable();

        expect(await screen.findByText('Showing the top 2 of 515 forwarders')).toBeInTheDocument();
    });

    it('tells when no forwarder failed to deploy an app or reconnected', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([]));

        renderTable();

        expect(
            await screen.findByText('No problem forwarders in this time range'),
        ).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('marks the column and the order it sorts by', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable({ column: 'reconnects', order: 'asc' });

        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        expect(columnHeader('Reconnects')).toHaveAttribute('aria-sort', 'ascending');
        expect(columnHeader('Failing apps')).toHaveAttribute('aria-sort', 'none');
        expect(columnHeader('Failing hours')).toHaveAttribute('aria-sort', 'none');
    });

    it('doesn’t sort by the name, host or version', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable();

        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        ['Forwarder', 'Host', 'Version'].forEach((label) =>
            expect(columnHeader(label)).not.toHaveAttribute('aria-sort'),
        );
    });

    it('sorts by another column from the highest count when you click its heading', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        const { onSortChange } = renderTable();
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        await userEvent.click(sortButton('Reconnects'));

        expect(onSortChange).toHaveBeenCalledWith({ column: 'reconnects', order: 'desc' });
    });

    it('reverses the order when you click the heading of the sorted column', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        const { onSortChange } = renderTable({ column: 'failingHours', order: 'desc' });
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        await userEvent.click(sortButton('Failing hours'));

        expect(onSortChange).toHaveBeenCalledWith({ column: 'failingHours', order: 'asc' });
    });

    it('sorts from the highest count again after the lowest', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        const { onSortChange } = renderTable({ column: 'failingHours', order: 'asc' });
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        await userEvent.click(sortButton('Failing hours'));

        expect(onSortChange).toHaveBeenCalledWith({ column: 'failingHours', order: 'desc' });
    });

    it('keeps the rows in place while it loads another sort', async () => {
        vi.mocked(oneShot)
            .mockResolvedValueOnce(searchResults([stuck, crashing]))
            .mockReturnValueOnce(new Promise(() => {}));

        renderWithQueryClient(<SortableTable />);
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        await userEvent.click(sortButton('Reconnects'));

        expect(await screen.findByText('Loading problem forwarders')).toBeInTheDocument();
        expect(columnHeader('Reconnects')).toHaveAttribute('aria-sort', 'descending');
        expect(bodyRows().map((row) => cellTexts(row)[0])).toEqual(['triss', 'vesemir']);
        expect(oneShot).toHaveBeenLastCalledWith(
            expect.objectContaining({ search: expect.stringContaining('| sort 100 - reconnects') }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('shows the rows in the new order once it loads them', async () => {
        vi.mocked(oneShot)
            .mockResolvedValueOnce(searchResults([stuck, crashing]))
            .mockResolvedValueOnce(searchResults([crashing, stuck]));

        renderWithQueryClient(<SortableTable />);
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        await userEvent.click(sortButton('Reconnects'));

        await waitFor(() =>
            expect(bodyRows().map((row) => cellTexts(row)[0])).toEqual(['vesemir', 'triss']),
        );
        expect(screen.getByText('Showing all 2 forwarders')).toBeInTheDocument();
        expect(screen.queryByText('Loading problem forwarders')).not.toBeInTheDocument();
    });

    it('scrolls the list back to its first row when it shows another sort', async () => {
        vi.mocked(oneShot)
            .mockResolvedValueOnce(searchResults([stuck, crashing]))
            .mockResolvedValueOnce(searchResults([crashing, stuck]));

        renderWithQueryClient(<SortableTable />);
        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        const list = screen.getByRole('table').parentElement as HTMLElement;
        list.scrollTop = 300;
        fireEvent.scroll(list);
        await userEvent.click(sortButton('Reconnects'));

        await waitFor(() =>
            expect(bodyRows().map((row) => cellTexts(row)[0])).toEqual(['vesemir', 'triss']),
        );
        expect(list.scrollTop).toBe(0);
    });

    it('searches the time range for the top 100 forwarders by the sorted column', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable({ column: 'failingHours', order: 'desc' });
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(
                    '| sort 100 - failingHours - failingApps - reconnects + name',
                ),
                earliest_time: '-24h@h',
                latest_time: 'now',
                output_mode: 'json',
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('searches for the lowest counts first when the order is ascending', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, crashing]));

        renderTable({ column: 'reconnects', order: 'asc' });
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(
                    '| sort 100 + reconnects - failingApps - failingHours + name',
                ),
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('shows the error when the search fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot).mockRejectedValue(new Error('Search job quota exceeded'));

        renderTable();

        expect(await screen.findByText('Couldn’t load problem forwarders')).toBeInTheDocument();
        expect(screen.getByText('Search job quota exceeded')).toBeInTheDocument();
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        vi.mocked(oneShot)
            .mockRejectedValueOnce(new Error('Search job quota exceeded'))
            .mockResolvedValueOnce(searchResults([stuck]));

        renderTable();
        await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(bodyRows()).toHaveLength(1));
        expect(screen.queryByText('Couldn’t load problem forwarders')).not.toBeInTheDocument();
    });
});

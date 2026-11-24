import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTime } from '../../formatTime';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { TimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import AgentActivity from './AgentActivity';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const timeRange: TimeRange = { earliest: '-24h@h', latest: 'now' };

const reason = 'Failed to untar archive=/opt/splunkforwarder/var/run/fleet_stuck/x.bundle';

const failures = {
    kind: 'app',
    first: '1795434190',
    last: '1795516989',
    times: '24',
    app: 'fleet_stuck_inputs',
    action: 'Install',
    result: 'Fail',
    reason,
};

const upgrade = {
    kind: 'reconnect',
    first: '1795491785',
    last: '1795491785',
    times: '1',
    name: 'triss',
    version: '10.2.4',
    ip: '10.8.67.115',
    previousName: 'triss',
    previousVersion: '10.0.7',
    previousIp: '10.8.67.115',
};

const install = {
    kind: 'app',
    first: '1795452180',
    last: '1795452180',
    times: '1',
    app: 'fleet_base',
    action: 'Install',
    result: 'Ok',
};

const restarts = {
    kind: 'reconnect',
    first: '1795434522',
    last: '1795440000',
    times: '5',
    name: 'triss',
    version: '10.0.7',
    ip: '10.8.67.115',
    previousName: 'triss',
    previousVersion: '10.0.7',
    previousIp: '10.8.67.115',
};

const searchResults = (rows: Record<string, string>[], total = rows.length) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: [],
    results: rows.map((row) => ({ ...row, total: String(total) })),
});

const renderActivity = () =>
    renderWithQueryClient(<AgentActivity guid={guid} timeRange={timeRange} />);

const bodyRows = () => screen.getAllByRole('row').slice(1);

const cellTexts = (row: HTMLElement) =>
    within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent);

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AgentActivity', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderActivity();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 2, name: 'Activity' })).toBeVisible();
        expect(screen.getByText('Loading activity')).toBeInTheDocument();
    });

    it('lists what happened to the agent, with repeated events as one entry', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([failures, upgrade, install, restarts]));

        renderActivity();

        await waitFor(() => expect(bodyRows()).toHaveLength(4));
        expect(bodyRows().map(cellTexts)).toEqual([
            [
                `${formatTime(1795434190)} – ${formatTime(1795516989)}`,
                'fleet_stuck_inputs failed to install 24 times',
                reason,
            ],
            [formatTime(1795491785), 'Connected again', 'Version 10.0.7 → 10.2.4'],
            [formatTime(1795452180), 'Installed fleet_base', ''],
            [
                `${formatTime(1795434522)} – ${formatTime(1795440000)}`,
                'Connected again 5 times',
                '',
            ],
        ]);
    });

    it('says it shows every entry when there are no more', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([failures, install]));

        renderActivity();

        expect(await screen.findByText('Showing all 2 entries')).toBeInTheDocument();
    });

    it('says how many entries there are when it shows only the most recent ones', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([failures, install], 230));

        renderActivity();

        expect(
            await screen.findByText('Showing the 2 most recent of 230 entries'),
        ).toBeInTheDocument();
    });

    it('tells when nothing happened in the time range', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([]));

        renderActivity();

        expect(await screen.findByText('No activity in this time range')).toBeInTheDocument();
    });

    it('searches only this agent in the time range', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([]));

        renderActivity();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(`index=_dsappevent data.clientId="${guid}"`),
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
            .mockResolvedValueOnce(searchResults([install]));

        renderActivity();

        expect(await screen.findByText('Couldn’t load activity')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(bodyRows()).toHaveLength(1));
    });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTime } from '../../formatTime';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import AgentAppsTable from './AgentAppsTable';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const reason =
    "Failed to untar archive=/opt/splunkforwarder/var/run/fleet_stuck/fleet_stuck_inputs-1795507200.bundle to='/opt/splunkforwarder/etc/apps/fleet_stuck_inputs'";

const stuck = {
    app: 'fleet_stuck_inputs',
    serverClass: 'fleet_stuck',
    status: 'failing',
    failingSince: '1795426993',
    reason,
};

const installed = {
    app: 'fleet_base',
    serverClass: 'fleet_ring_3',
    status: 'installed',
    lastSuccess: '1795452180',
};

const searchResults = (rows: Record<string, string>[]) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: [],
    results: rows,
});

const bodyRows = () => screen.getAllByRole('row').slice(1);

const cellTexts = (row: HTMLElement) =>
    within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent);

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AgentAppsTable', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows a loading message while the search runs', async () => {
        vi.mocked(oneShot).mockReturnValue(new Promise(() => {}));

        renderWithQueryClient(<AgentAppsTable guid={guid} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 2, name: 'Apps' })).toBeVisible();
        expect(screen.getByText('Loading apps')).toBeInTheDocument();
    });

    it('shows the latest state of each app', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([stuck, installed]));

        renderWithQueryClient(<AgentAppsTable guid={guid} />);

        await waitFor(() => expect(bodyRows()).toHaveLength(2));
        expect(bodyRows().map(cellTexts)).toEqual([
            ['fleet_stuck_inputs', 'fleet_stuck', 'Failing', '—', formatTime(1795426993), reason],
            ['fleet_base', 'fleet_ring_3', 'Installed', formatTime(1795452180), '—', '—'],
        ]);
    });

    it('tells when the deployment server sent the agent no apps', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([]));

        renderWithQueryClient(<AgentAppsTable guid={guid} />);

        expect(await screen.findByText('No apps in the last 60 days')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('searches all the app events of this agent that the index keeps', async () => {
        vi.mocked(oneShot).mockResolvedValue(searchResults([]));

        renderWithQueryClient(<AgentAppsTable guid={guid} />);
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(`index=_dsappevent data.clientId="${guid}"`),
                earliest_time: '0',
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
            .mockResolvedValueOnce(searchResults([installed]));

        renderWithQueryClient(<AgentAppsTable guid={guid} />);

        expect(await screen.findByText('Couldn’t load apps')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(bodyRows()).toHaveLength(1));
    });
});

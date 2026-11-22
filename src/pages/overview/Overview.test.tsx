import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY_SECONDS, mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Overview from './Overview';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn(() => new Promise(() => {})) }));
vi.mock(
    '@splunk/react-time-range/SplunkwebConnector',
    () => import('../../testing/SplunkwebConnectorMock'),
);

const AgentsPage = () => <h1>Agents page</h1>;

const searchedWith = (expected: Record<string, unknown>) =>
    waitFor(() =>
        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining(expected),
            undefined,
            undefined,
            expect.anything(),
        ),
    );

describe('Overview', () => {
    beforeEach(() => {
        vi.mocked(oneShot).mockClear();
        mockTimeParser({ '-7d@h': 7 * DAY_SECONDS });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the page heading', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Overview' }),
        ).toBeInTheDocument();
    });

    it('shows the connected forwarders chart', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Connected forwarders' }),
        ).toBeInTheDocument();
    });

    it('shows the forwarder reconnects chart', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Forwarder reconnects' }),
        ).toBeInTheDocument();
    });

    it('shows the deployment activity chart', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Deployment activity' }),
        ).toBeInTheDocument();
    });

    it('opens the agents page from its link', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        await userEvent.click(await screen.findByRole('link', { name: 'Agents' }));

        expect(await screen.findByRole('heading', { name: 'Agents page' })).toBeInTheDocument();
    });

    it('shows the last 24 hours in 1-hour buckets by default', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(await screen.findByRole('button', { name: 'Last 24 hours' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Resolution: 1 hour' })).toBeVisible();
        await searchedWith({
            earliest_time: '-24h@h',
            latest_time: 'now',
            search: expect.stringContaining('span=1h'),
        });
    });

    it('reads the time range and the resolution from the URL', async () => {
        renderWithRouter('/overview?earliest=-7d%40h&latest=now&resolution=auto', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Resolution: Auto' })).toBeVisible();
        await searchedWith({
            earliest_time: '-7d@h',
            latest_time: 'now',
            search: expect.stringContaining('span=6h'),
        });
    });

    it('keeps the chosen resolution in the URL and searches with it', async () => {
        const { router } = renderWithRouter('/overview', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        await userEvent.click(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' }));
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({ resolution: '15m' }),
        );
        await searchedWith({ search: expect.stringContaining('span=15m') });
    });

    it('reads epoch times from the URL as times', async () => {
        renderWithRouter('/overview?earliest=1795219200&latest=1795305600', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        await searchedWith({ earliest_time: '1795219200', latest_time: '1795305600' });
    });

    it('falls back to the default resolution when the URL has an unknown one', async () => {
        renderWithRouter('/overview?resolution=fortnightly', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        expect(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' })).toBeVisible();
        await searchedWith({ search: expect.stringContaining('span=1h') });
    });
});

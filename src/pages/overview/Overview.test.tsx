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

    it('shows the problem forwarders table', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Problem forwarders' }),
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

    it('lists the forwarders with the most failing apps first by default', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(await screen.findByRole('columnheader', { name: /^Failing apps/ })).toHaveAttribute(
            'aria-sort',
            'descending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 - failingApps - failingHours - reconnects'),
        });
    });

    it('reads the sorted column and the order from the URL', async () => {
        renderWithRouter('/overview?sort=reconnects&order=asc', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        expect(await screen.findByRole('columnheader', { name: /^Reconnects/ })).toHaveAttribute(
            'aria-sort',
            'ascending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 + reconnects - failingApps - failingHours'),
        });
    });

    it('keeps the sorted column in the URL and searches with it', async () => {
        const { router } = renderWithRouter('/overview', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        await userEvent.click(await screen.findByRole('button', { name: /^Failing hours/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({
                sort: 'failingHours',
                order: 'desc',
            }),
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 - failingHours - failingApps - reconnects'),
        });
    });

    it('keeps the sorted column when you change the resolution', async () => {
        const { router } = renderWithRouter('/overview?sort=reconnects&order=asc', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        await userEvent.click(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' }));
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({
                resolution: '15m',
                sort: 'reconnects',
                order: 'asc',
            }),
        );
    });

    it('keeps the time range when you sort by another column', async () => {
        const { router } = renderWithRouter('/overview?earliest=-7d%40h&latest=now&resolution=6h', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        await userEvent.click(await screen.findByRole('button', { name: /^Reconnects/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({
                earliest: '-7d@h',
                latest: 'now',
                resolution: '6h',
                sort: 'reconnects',
            }),
        );
    });

    it('stays where you scrolled to when you sort by another column', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });
        const reconnects = await screen.findByRole('button', { name: /^Reconnects/ });
        vi.mocked(window.scrollTo).mockClear();

        await userEvent.click(reconnects);

        await waitFor(() =>
            expect(screen.getByRole('columnheader', { name: /^Reconnects/ })).toHaveAttribute(
                'aria-sort',
                'descending',
            ),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('stays where you scrolled to when you change the resolution', async () => {
        const { router } = renderWithRouter('/overview', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });
        const resolution = await screen.findByRole('combobox', { name: 'Resolution: 1 hour' });
        vi.mocked(window.scrollTo).mockClear();

        await userEvent.click(resolution);
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({ resolution: '15m' }),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('falls back to the default sort when the URL has an unknown one', async () => {
        renderWithRouter('/overview?sort=hostname&order=sideways', {
            '/overview': Overview,
            '/agents': AgentsPage,
        });

        expect(await screen.findByRole('columnheader', { name: /^Failing apps/ })).toHaveAttribute(
            'aria-sort',
            'descending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 - failingApps - failingHours - reconnects'),
        });
    });
});

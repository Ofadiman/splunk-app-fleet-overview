import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { searchMock as oneShot } from '../../testing/SearchMock';
import { restoreAllMocks } from '@vitest/spy';
import { afterEach, beforeEach, describe, expect, it } from '#component-tests';
import { DAY_SECONDS, mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Home from './Home';

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

const renderHome = async (initialPath = '/home') => {
    const rendered = renderWithRouter(initialPath, { '/home': Home, '/agents': AgentsPage });
    await searchedWith({ search: expect.stringContaining('| timechart ') });
    return rendered;
};

describe('Home', () => {
    beforeEach(() => {
        oneShot.mockReset().mockImplementation(() => new Promise(() => {}));
        mockTimeParser({ '-7d@h': 7 * DAY_SECONDS });
    });

    afterEach(() => {
        restoreAllMocks();
    });

    it('renders the page heading', async () => {
        await renderHome();

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Overview' }),
        ).toBeInTheDocument();
    });

    it('shows the connected forwarders chart', async () => {
        await renderHome();

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Connected forwarders' }),
        ).toBeInTheDocument();
    });

    it('shows the forwarder reconnects chart', async () => {
        await renderHome();

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Forwarder reconnects' }),
        ).toBeInTheDocument();
    });

    it('shows the deployment activity chart', async () => {
        await renderHome();

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Deployment activity' }),
        ).toBeInTheDocument();
    });

    it('shows the problem forwarders table', async () => {
        await renderHome();

        expect(
            await screen.findByRole('heading', { level: 2, name: 'Problem forwarders' }),
        ).toBeInTheDocument();
    });

    it('shows the last 24 hours in 1-hour buckets by default', async () => {
        await renderHome();

        expect(await screen.findByRole('button', { name: 'Last 24 hours' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Resolution: 1 hour' })).toBeVisible();
        await searchedWith({
            earliest_time: '-24h@h',
            latest_time: 'now',
            search: expect.stringContaining('span=1h'),
        });
    });

    it('reads the time range and the resolution from the URL', async () => {
        await renderHome('/home?earliest=-7d%40h&latest=now&resolution=auto');

        expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Resolution: Auto' })).toBeVisible();
        await searchedWith({
            earliest_time: '-7d@h',
            latest_time: 'now',
            search: expect.stringContaining('span=6h'),
        });
    });

    it('keeps the chosen resolution in the URL and searches with it', async () => {
        const { router } = await renderHome();

        await userEvent.click(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' }));
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({ resolution: '15m' }),
        );
        await searchedWith({ search: expect.stringContaining('span=15m') });
    });

    it('reads epoch times from the URL as times', async () => {
        await renderHome('/home?earliest=1795219200&latest=1795305600');

        await searchedWith({ earliest_time: '1795219200', latest_time: '1795305600' });
    });

    it('falls back to the default resolution when the URL has an unknown one', async () => {
        await renderHome('/home?resolution=fortnightly');

        expect(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' })).toBeVisible();
        await searchedWith({ search: expect.stringContaining('span=1h') });
    });

    it('lists the forwarders with the most failing apps first by default', async () => {
        await renderHome();

        expect(await screen.findByRole('columnheader', { name: /^Failing apps/ })).toHaveAttribute(
            'aria-sort',
            'descending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 - failingApps - failingHours - reconnects'),
        });
    });

    it('reads the sorted column and the order from the URL', async () => {
        await renderHome('/home?sort=reconnects&order=asc');

        expect(await screen.findByRole('columnheader', { name: /^Reconnects/ })).toHaveAttribute(
            'aria-sort',
            'ascending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 + reconnects - failingApps - failingHours'),
        });
    });

    it('keeps the sorted column in the URL and searches with it', async () => {
        const { router } = await renderHome();

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
        const { router } = await renderHome('/home?sort=reconnects&order=asc');

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
        const { router } = await renderHome('/home?earliest=-7d%40h&latest=now&resolution=6h');

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
        await renderHome();
        const reconnects = await screen.findByRole('button', { name: /^Reconnects/ });
        reconnects.scrollIntoView({ block: 'center' });
        const scrollPosition = window.scrollY;
        expect(scrollPosition).toBeGreaterThan(0);

        await userEvent.click(reconnects);

        await waitFor(() =>
            expect(screen.getByRole('columnheader', { name: /^Reconnects/ })).toHaveAttribute(
                'aria-sort',
                'descending',
            ),
        );
        expect(window.scrollY).toBe(scrollPosition);
    });

    it('stays where you scrolled to when you change the resolution', async () => {
        const { router } = await renderHome();
        const resolution = await screen.findByRole('combobox', { name: 'Resolution: 1 hour' });
        window.scrollTo(0, 32);
        const scrollPosition = window.scrollY;
        expect(scrollPosition).toBeGreaterThan(0);

        await userEvent.click(resolution);
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({ resolution: '15m' }),
        );
        expect(window.scrollY).toBe(scrollPosition);
    });

    it('falls back to the default sort when the URL has an unknown one', async () => {
        await renderHome('/home?sort=hostname&order=sideways');

        expect(await screen.findByRole('columnheader', { name: /^Failing apps/ })).toHaveAttribute(
            'aria-sort',
            'descending',
        );
        await searchedWith({
            search: expect.stringContaining('| sort 100 - failingApps - failingHours - reconnects'),
        });
    });
});

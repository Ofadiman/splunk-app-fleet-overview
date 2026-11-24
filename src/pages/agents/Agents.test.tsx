import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY_SECONDS, mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Agents from './Agents';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Column', () => ({ default: vi.fn(() => null) }));
vi.mock(
    '@splunk/react-time-range/SplunkwebConnector',
    () => import('../../testing/SplunkwebConnectorMock'),
);

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const HomePage = () => <h1>Home page</h1>;

const pages = { '/agents': Agents, '/home': HomePage };

const searchedWith = (expected: Record<string, unknown>) =>
    waitFor(() =>
        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining(expected),
            undefined,
            undefined,
            expect.anything(),
        ),
    );

describe('Agents', () => {
    beforeEach(() => {
        mockTimeParser({ '-7d@h': 7 * DAY_SECONDS });
        vi.mocked(oneShot).mockReset();
        vi.mocked(oneShot).mockImplementation((params) =>
            String((params as { search: string }).search).includes('values(data.lastPhoneHomeTime)')
                ? Promise.resolve({ results: [{ name: 'triss', host: 'triss.splunk.com' }] })
                : new Promise(() => {}),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('asks to pick an agent when the URL has no GUID', async () => {
        renderWithRouter('/agents', pages);

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Agents' }),
        ).toBeInTheDocument();
        expect(screen.getByText('No agent selected')).toBeInTheDocument();
        expect(oneShot).not.toHaveBeenCalled();
    });

    it('tells when the GUID in the URL isn’t a GUID', async () => {
        renderWithRouter('/agents?guid=triss', pages);

        expect(await screen.findByText('“triss” isn’t an agent GUID')).toBeInTheDocument();
        expect(oneShot).not.toHaveBeenCalled();
    });

    it('shows the agent with the GUID from the URL', async () => {
        renderWithRouter(`/agents?guid=${guid}`, pages);

        expect(await screen.findByRole('heading', { level: 1, name: 'triss' })).toBeInTheDocument();
        await searchedWith({ search: expect.stringContaining(`data.clientId="${guid}"`) });
    });

    it('reads the time range and the resolution from the URL', async () => {
        renderWithRouter(`/agents?guid=${guid}&earliest=-7d%40h&latest=now&resolution=6h`, pages);

        expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeVisible();
        await searchedWith({
            earliest_time: '-7d@h',
            search: expect.stringContaining('span=6h'),
        });
    });

    it('keeps the agent in the URL when you change the resolution', async () => {
        const { router } = renderWithRouter(`/agents?guid=${guid}`, pages);

        await userEvent.click(await screen.findByRole('combobox', { name: 'Resolution: 1 hour' }));
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        await waitFor(() =>
            expect(router.state.location.search).toMatchObject({ guid, resolution: '15m' }),
        );
    });

    it('opens the overview page from its link', async () => {
        renderWithRouter(`/agents?guid=${guid}`, pages);

        await userEvent.click(await screen.findByRole('link', { name: 'Overview' }));

        expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    });
});

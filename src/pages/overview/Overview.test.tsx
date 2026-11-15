import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Overview from './Overview';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn(() => new Promise(() => {})) }));

const AgentsPage = () => <h1>Agents page</h1>;

describe('Overview', () => {
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
});

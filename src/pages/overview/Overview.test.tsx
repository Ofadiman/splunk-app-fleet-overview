import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Overview from './Overview';

const AgentsPage = () => <h1>Agents page</h1>;

describe('Overview', () => {
    it('renders the page heading', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Overview' }),
        ).toBeInTheDocument();
    });

    it('opens the agents page from its link', async () => {
        renderWithRouter('/overview', { '/overview': Overview, '/agents': AgentsPage });

        await userEvent.click(await screen.findByRole('link', { name: 'Agents' }));

        expect(await screen.findByRole('heading', { name: 'Agents page' })).toBeInTheDocument();
    });
});

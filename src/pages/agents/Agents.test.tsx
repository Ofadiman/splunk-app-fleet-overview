import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Agents from './Agents';

const OverviewPage = () => <h1>Overview page</h1>;

describe('Agents', () => {
    it('renders the page heading', async () => {
        renderWithRouter('/agents', { '/agents': Agents, '/overview': OverviewPage });

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Agents' }),
        ).toBeInTheDocument();
    });

    it('opens the overview page from its link', async () => {
        renderWithRouter('/agents', { '/agents': Agents, '/overview': OverviewPage });

        await userEvent.click(await screen.findByRole('link', { name: 'Overview' }));

        expect(await screen.findByRole('heading', { name: 'Overview page' })).toBeInTheDocument();
    });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../testing/renderWithRouter';
import Agents from './Agents';

const HomePage = () => <h1>Home page</h1>;

describe('Agents', () => {
    it('renders the page heading', async () => {
        renderWithRouter('/agents', { '/agents': Agents, '/home': HomePage });

        expect(
            await screen.findByRole('heading', { level: 1, name: 'Agents' }),
        ).toBeInTheDocument();
    });

    it('opens the home page from its link', async () => {
        renderWithRouter('/agents', { '/agents': Agents, '/home': HomePage });

        await userEvent.click(await screen.findByRole('link', { name: 'Overview' }));

        expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    });
});

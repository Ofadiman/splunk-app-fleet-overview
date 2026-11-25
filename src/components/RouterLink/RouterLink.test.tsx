import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '#component-tests';
import { renderWithRouter } from '../../testing/renderWithRouter';
import RouterLink from './RouterLink';

const StartPage = () => <RouterLink to="/agents">Agents</RouterLink>;
const TargetPage = () => <h1>Agents page</h1>;

describe('RouterLink', () => {
    it('links to the path of the route', async () => {
        renderWithRouter('/home', { '/home': StartPage, '/agents': TargetPage });

        expect(await screen.findByRole('link', { name: 'Agents' })).toHaveAttribute(
            'href',
            '/agents',
        );
    });

    it('opens the route in the app when clicked', async () => {
        const { router } = renderWithRouter('/home', {
            '/home': StartPage,
            '/agents': TargetPage,
        });

        await userEvent.click(await screen.findByRole('link', { name: 'Agents' }));

        expect(await screen.findByRole('heading', { name: 'Agents page' })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/agents');
    });
});

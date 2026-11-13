import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Overview from './Overview';

describe('Overview', () => {
    it('renders the app name', () => {
        render(<Overview />);
        expect(screen.getByRole('heading', { name: /fleet-overview/i })).toBeInTheDocument();
    });
});

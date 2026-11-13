import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Agents from './Agents';

describe('Agents', () => {
    it('renders the page heading', () => {
        render(<Agents />);
        expect(screen.getByRole('heading', { level: 1, name: 'Agents' })).toBeInTheDocument();
    });
});

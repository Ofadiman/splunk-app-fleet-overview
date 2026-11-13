import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const createTestQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false } } });

export const renderWithQueryClient = (ui: ReactElement) =>
    render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>);

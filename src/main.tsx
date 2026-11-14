import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClientDefaultOptions } from './queryClient';
import { renderPage } from './renderPage';
import { router } from './router';

const queryClient = new QueryClient({ defaultOptions: queryClientDefaultOptions });

renderPage(
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>,
);

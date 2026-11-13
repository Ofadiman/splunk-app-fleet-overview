import { render } from '@testing-library/react';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import type { RouteComponent } from '@tanstack/react-router';

export const renderWithRouter = (initialPath: string, pages: Record<string, RouteComponent>) => {
    const rootRoute = createRootRoute();
    const routeTree = rootRoute.addChildren(
        Object.entries(pages).map(([path, component]) =>
            createRoute({ getParentRoute: () => rootRoute, path, component }),
        ),
    );
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [initialPath] }),
    });

    return { router, ...render(<RouterProvider router={router} />) };
};

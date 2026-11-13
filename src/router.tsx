import { useEffect } from 'react';
import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useMatches,
} from '@tanstack/react-router';
import { app } from '@splunk/splunk-utils/config';
import { createURL } from '@splunk/splunk-utils/url';
import Agents from './Agents';
import App from './App';

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }

    interface StaticDataRouteOption {
        title?: string;
    }
}

const PageTitle = () => {
    const title = useMatches({
        select: (matches) =>
            matches
                .map((match) => match.staticData.title)
                .filter(Boolean)
                .at(-1),
    });

    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return null;
};

const RootLayout = () => (
    <>
        <PageTitle />
        <Outlet />
    </>
);

const rootRoute = createRootRoute({ component: RootLayout });

const overviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/overview',
    staticData: { title: 'Overview' },
    component: App,
});

const agentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agents',
    staticData: { title: 'Agents' },
    component: Agents,
});

const routeTree = rootRoute.addChildren([overviewRoute, agentsRoute]);

export const router = createRouter({
    routeTree,
    basepath: createURL(`app/${app}`),
});

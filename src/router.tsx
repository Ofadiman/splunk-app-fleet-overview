import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { app } from '@splunk/splunk-utils/config';
import { createURL } from '@splunk/splunk-utils/url';
import Agents from './pages/agents/Agents';
import Overview from './pages/overview/Overview';

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const viewLabels: Partial<Record<string, string>> = __VIEW_LABELS__;

const setViewTitle = () => {
    const title = viewLabels[router.state.matches.at(-1)?.fullPath.slice(1) ?? ''];
    if (title) {
        document.title = title;
    }
};

const rootRoute = createRootRoute({
    onEnter: setViewTitle,
    onStay: setViewTitle,
});

const overviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/overview',
    component: Overview,
});

const agentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agents',
    component: Agents,
});

const routeTree = rootRoute.addChildren([overviewRoute, agentsRoute]);

export const router = createRouter({
    routeTree,
    basepath: createURL(`app/${app}`),
});

import {
    createRootRoute,
    createRoute,
    createRouter,
    stripSearchParams,
} from '@tanstack/react-router';
import { app } from '@splunk/splunk-utils/config';
import { createURL } from '@splunk/splunk-utils/url';
import { DEFAULT_TIME_RANGE } from './components/TimeRangeControls/TimeRangeControls.constants';
import Agents from './pages/agents/Agents';
import Overview from './pages/overview/Overview';
import { overviewSearchSchema } from './pages/overview/Overview.schema';

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
    validateSearch: overviewSearchSchema,
    search: { middlewares: [stripSearchParams(DEFAULT_TIME_RANGE)] },
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

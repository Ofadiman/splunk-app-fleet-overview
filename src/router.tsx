import {
    createRootRoute,
    createRoute,
    createRouter,
    stripSearchParams,
} from '@tanstack/react-router';
import { app } from '@splunk/splunk-utils/config';
import { createURL } from '@splunk/splunk-utils/url';
import Agents from './pages/agents/Agents';
import { agentsSearchSchema } from './pages/agents/Agents.schema';
import Home from './pages/home/Home';
import { homeSearchSchema } from './pages/home/Home.schema';

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

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    component: Home,
    validateSearch: homeSearchSchema,
    search: { middlewares: [stripSearchParams(homeSearchSchema.parse({}))] },
});

const agentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agents',
    component: Agents,
    validateSearch: agentsSearchSchema,
    search: { middlewares: [stripSearchParams(agentsSearchSchema.parse({}))] },
});

const routeTree = rootRoute.addChildren([homeRoute, agentsRoute]);

export const router = createRouter({
    routeTree,
    basepath: createURL(`app/${app}`),
});

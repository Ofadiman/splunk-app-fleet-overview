import { useState } from 'react';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import ProblemForwardersTable from '../../src/components/ProblemForwardersTable/ProblemForwardersTable';
import type { ForwarderSort } from '../../src/components/ProblemForwardersTable/ProblemForwardersTable.types';
import type { ChartTimeRange } from '../../src/components/TimeRangeControls/TimeRangeControls.types';
import { mountComponent } from '../support/mountComponent';

const timeRange: ChartTimeRange = { earliest: '-4h@m', latest: 'now', resolution: '15m' };

const triss = {
    clientId: '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C',
    name: 'triss',
    version: '10.0.7',
    failingApps: '1',
    failingHours: '24',
    reconnects: '2',
    total: '2',
};

const vesemir = {
    clientId: '9AFF545B-0AC6-4062-95CF-BDD989C175D6',
    name: 'vesemir',
    version: '10.2.4',
    failingApps: '0',
    failingHours: '0',
    reconnects: '121',
    total: '2',
};

const SortableTable = () => {
    const [sort, setSort] = useState<ForwarderSort>({ column: 'failingApps', order: 'desc' });
    return <ProblemForwardersTable timeRange={timeRange} sort={sort} onSortChange={setSort} />;
};

const mountTable = () => {
    const rootRoute = createRootRoute();
    const routeTree = rootRoute.addChildren([
        createRoute({ getParentRoute: () => rootRoute, path: '/home', component: SortableTable }),
        createRoute({
            getParentRoute: () => rootRoute,
            path: '/agents',
            component: () => <h1>Agent details</h1>,
        }),
    ]);
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ['/home'] }),
    });

    mountComponent(<RouterProvider router={router} />);
};

describe('ProblemForwardersTable', () => {
    beforeEach(() => {
        cy.intercept('POST', '**/search/v2/jobs', (request) => {
            const search = new URLSearchParams(request.body).get('search');
            const sortByReconnects = search?.includes('| sort 100 - reconnects');
            request.reply({ results: sortByReconnects ? [vesemir, triss] : [triss, vesemir] });
        });
    });

    it('reorders the rows when sorting by reconnects', () => {
        mountTable();

        cy.get('tbody tr').first().should('contain.text', triss.name);
        cy.contains('button', 'Reconnects').click();
        cy.contains('th', 'Reconnects').should('have.attr', 'aria-sort', 'descending');
        cy.get('tbody tr').first().should('contain.text', vesemir.name);
    });

    it('opens the selected forwarder with the current time range', () => {
        mountTable();

        cy.contains('a', triss.name).should(($link) => {
            const url = new URL($link.prop('href'));
            expect(url.pathname).to.equal('/agents');
            expect(Object.fromEntries(url.searchParams)).to.deep.equal({
                guid: triss.clientId,
                ...timeRange,
            });
        });
        cy.contains('a', triss.name).click();
        cy.contains('h1', 'Agent details').should('be.visible');
    });
});

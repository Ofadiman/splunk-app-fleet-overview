import ConnectedForwardersChart from '../../src/components/ConnectedForwardersChart/ConnectedForwardersChart';
import { mountComponent } from '../support/mountComponent';

describe('ConnectedForwardersChart', () => {
    it('draws a visible line from the Splunk search results', () => {
        cy.intercept('GET', '**/search/timeparser?*', {
            '-24h@h': '1795219200',
            now: '1795305600',
        });
        cy.intercept('POST', '**/search/v2/jobs', {
            fields: ['_time', 'connected'],
            columns: [
                ['2026-11-21T10:00:00.000+00:00', '2026-11-21T11:00:00.000+00:00'],
                ['5', '4'],
            ],
        });

        mountComponent(
            <ConnectedForwardersChart
                timeRange={{ earliest: '-24h@h', latest: 'now', resolution: '1h' }}
            />,
        );

        cy.get('path.highcharts-graph')
            .should('be.visible')
            .and('have.attr', 'd')
            .and('match', /^M.+L/);
    });
});

describe('Overview', () => {
    it('keeps the selected chart resolution after reloading the overview', () => {
        cy.visit('/en-US/app/fleet_overview/home');
        cy.get('input[name="username"]').type('admin');
        cy.get('input[name="password"]').type('password{enter}', { log: false });

        cy.contains('h1', /^Overview$/).should('be.visible');
        cy.contains('[role="combobox"]', /^Resolution: 1 hour$/).click();
        cy.contains('[role="option"]', /^15 minutes$/).click();

        const selectedResolution = /^Resolution: 15 minutes$/;
        cy.contains('[role="combobox"]', selectedResolution).should('be.visible');
        cy.reload();
        cy.contains('[role="combobox"]', selectedResolution).should('be.visible');
    });
});

import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Reconnects'),
    description: _(
        'Number of times this agent connected to the deployment server after it started or restarted in each interval',
    ),
    seriesLabel: _('Reconnects'),
    loading: _('Loading reconnects'),
    errorTitle: _('Couldn’t load reconnects'),
    retry: _('Try again'),
    emptyTitle: _('No reconnects in this time range'),
    emptyDescription: _(
        'An agent reconnects when it restarts or comes back after it stops phoning home. To see reconnects, you need a role that can search the _dsclient index, such as admin.',
    ),
};

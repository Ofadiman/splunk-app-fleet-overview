import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Phone homes'),
    description: _(
        'Number of times this agent phoned home to the deployment server in each interval',
    ),
    seriesLabel: _('Phone homes'),
    loading: _('Loading phone homes'),
    errorTitle: _('Couldn’t load phone homes'),
    retry: _('Try again'),
    emptyTitle: _('No phone homes in this time range'),
    emptyDescription: _(
        'The deployment server keeps phone homes in the _dsphonehome index for 7 days. An agent that stopped phoning home has none after it stopped. To see phone homes, you need a role that can search the _dsphonehome index, such as admin.',
    ),
};

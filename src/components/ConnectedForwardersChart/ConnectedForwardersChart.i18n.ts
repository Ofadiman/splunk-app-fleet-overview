import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Connected forwarders'),
    description: _(
        'Number of forwarders that phoned home to the deployment server at least once in each interval',
    ),
    seriesLabel: _('Connected forwarders'),
    loading: _('Loading connected forwarders'),
    errorTitle: _('Couldn’t load connected forwarders'),
    retry: _('Try again'),
    emptyTitle: _('No forwarder phoned home in this time range'),
    emptyDescription: _(
        'To see phone homes, you need a role that can search the _dsphonehome index, such as admin.',
    ),
};

import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Connected forwarders'),
    subtitle: _('Last 60 minutes'),
    seriesLabel: _('Connected forwarders'),
    loading: _('Loading connected forwarders'),
    errorTitle: _('Couldn’t load connected forwarders'),
    retry: _('Try again'),
    emptyTitle: _('No forwarder phoned home in the last 60 minutes'),
    emptyDescription: _(
        'To see phone homes, you need a role that can search the _dsphonehome index, such as admin.',
    ),
};

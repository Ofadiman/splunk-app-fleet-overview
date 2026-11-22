import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Forwarder reconnects'),
    description: _(
        'Number of times forwarders connected to the deployment server after they started or restarted in each interval',
    ),
    seriesLabel: _('Reconnects'),
    loading: _('Loading forwarder reconnects'),
    errorTitle: _('Couldn’t load forwarder reconnects'),
    retry: _('Try again'),
    emptyTitle: _('No forwarder reconnected in this time range'),
    emptyDescription: _(
        'Forwarders reconnect when they restart or come back after they stop phoning home. To see reconnects, you need a role that can search the _dsclient index, such as admin.',
    ),
};

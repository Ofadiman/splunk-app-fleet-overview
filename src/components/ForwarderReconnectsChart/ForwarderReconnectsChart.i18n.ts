import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Forwarder reconnects'),
    subtitle: _('Last 60 minutes'),
    seriesLabel: _('Reconnects'),
    loading: _('Loading forwarder reconnects'),
    errorTitle: _('Couldn’t load forwarder reconnects'),
    retry: _('Try again'),
    emptyTitle: _('No forwarder reconnected in the last 60 minutes'),
    emptyDescription: _(
        'Forwarders reconnect when they restart or come back after they stop phoning home. To see reconnects, you need a role that can search the _dsclient index, such as admin.',
    ),
};

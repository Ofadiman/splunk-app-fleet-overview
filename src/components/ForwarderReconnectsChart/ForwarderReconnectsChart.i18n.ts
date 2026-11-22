import { _ } from '@splunk/ui-utils/i18n';
import { messages as timeRangeMessages } from '../TimeRangeControls/TimeRangeControls.i18n';

export const messages = {
    title: _('Forwarder reconnects'),
    subtitles: timeRangeMessages.perSpan,
    seriesLabel: _('Reconnects'),
    loading: _('Loading forwarder reconnects'),
    errorTitle: _('Couldn’t load forwarder reconnects'),
    retry: _('Try again'),
    emptyTitle: _('No forwarder reconnected in this time range'),
    emptyDescription: _(
        'Forwarders reconnect when they restart or come back after they stop phoning home. To see reconnects, you need a role that can search the _dsclient index, such as admin.',
    ),
};

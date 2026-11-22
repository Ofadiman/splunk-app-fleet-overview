import { _ } from '@splunk/ui-utils/i18n';
import type { Span } from './DeploymentActivityChart.types';

export const messages = {
    title: _('Deployment activity'),
    subtitles: {
        '1m': _('Forwarders per minute'),
        '5m': _('Forwarders per 5 minutes'),
        '15m': _('Forwarders per 15 minutes'),
        '30m': _('Forwarders per 30 minutes'),
        '1h': _('Forwarders per hour'),
        '6h': _('Forwarders per 6 hours'),
        '1d': _('Forwarders per day'),
        '7d': _('Forwarders per week'),
    } satisfies Record<Span, string>,
    installedLabel: _('Installed'),
    uninstalledLabel: _('Uninstalled'),
    failedLabel: _('Failed'),
    loading: _('Loading deployment activity'),
    errorTitle: _('Couldn’t load deployment activity'),
    retry: _('Try again'),
    emptyTitle: _('No app deployments in this time range'),
    emptyDescription: _(
        'The chart shows forwarders that install, uninstall or fail to install an app. To see them, you need a role that can search the _dsappevent index, such as admin.',
    ),
};

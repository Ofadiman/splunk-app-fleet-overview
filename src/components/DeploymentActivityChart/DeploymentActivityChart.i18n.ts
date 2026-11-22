import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Deployment activity'),
    description: _(
        'Number of forwarders that installed, uninstalled or failed to deploy an app in each interval',
    ),
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

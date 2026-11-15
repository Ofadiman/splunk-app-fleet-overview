import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Deployment activity'),
    subtitle: _('Forwarders per minute in the last 60 minutes'),
    installedLabel: _('Installed'),
    uninstalledLabel: _('Uninstalled'),
    failedLabel: _('Failed'),
    loading: _('Loading deployment activity'),
    errorTitle: _('Couldn’t load deployment activity'),
    retry: _('Try again'),
    emptyTitle: _('No app deployments in the last 60 minutes'),
    emptyDescription: _(
        'The chart shows forwarders that install, uninstall or fail to install an app. To see them, you need a role that can search the _dsappevent index, such as admin.',
    ),
};

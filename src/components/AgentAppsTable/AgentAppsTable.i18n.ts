import { _ } from '@splunk/ui-utils/i18n';
import type { AppStatus } from './AgentAppsTable.types';

export const messages = {
    title: _('Apps'),
    description: _(
        'Latest state of each app that the deployment server sent to this agent in the last 60 days',
    ),
    app: _('App'),
    serverClass: _('Server class'),
    status: _('Status'),
    lastSuccess: _('Last success'),
    lastSuccessTooltip: _('When the agent last installed or uninstalled the app'),
    failingSince: _('Failing since'),
    failingSinceTooltip: _('When the first failure after the last success happened'),
    reason: _('Failure reason'),
    statuses: {
        failing: _('Failing'),
        installed: _('Installed'),
        uninstalled: _('Uninstalled'),
        downloaded: _('Downloaded'),
    } satisfies Record<AppStatus, string>,
    loading: _('Loading apps'),
    errorTitle: _('Couldn’t load apps'),
    retry: _('Try again'),
    emptyTitle: _('No apps in the last 60 days'),
    emptyDescription: _(
        'The deployment server hasn’t sent this agent any app that it kept a record of. To see apps, you need a role that can search the _dsappevent index, such as admin.',
    ),
};

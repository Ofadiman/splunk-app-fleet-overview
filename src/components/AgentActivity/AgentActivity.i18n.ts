import { _ } from '@splunk/ui-utils/i18n';
import type { AppAction, IdentityChange } from './AgentActivity.types';

export const messages = {
    title: _('Activity'),
    description: _(
        'What happened to this agent, newest first. Repeated events count as one entry.',
    ),
    time: _('Time'),
    event: _('Event'),
    details: _('Details'),
    timeSpan: _('%s – %s'),
    reconnected: _('Connected again'),
    reconnectedTimes: _('Connected again %s times'),
    succeeded: {
        Download: _('Downloaded %s'),
        Install: _('Installed %s'),
        Uninstall: _('Uninstalled %s'),
    } satisfies Record<AppAction, string>,
    succeededTimes: {
        Download: _('Downloaded %s %s times'),
        Install: _('Installed %s %s times'),
        Uninstall: _('Uninstalled %s %s times'),
    } satisfies Record<AppAction, string>,
    failed: {
        Download: _('%s failed to download'),
        Install: _('%s failed to install'),
        Uninstall: _('%s failed to uninstall'),
    } satisfies Record<AppAction, string>,
    failedTimes: {
        Download: _('%s failed to download %s times'),
        Install: _('%s failed to install %s times'),
        Uninstall: _('%s failed to uninstall %s times'),
    } satisfies Record<AppAction, string>,
    otherEvent: _('%s: %s %s'),
    changes: {
        name: _('Name %s → %s'),
        version: _('Version %s → %s'),
        ip: _('IP address %s → %s'),
    } satisfies Record<IdentityChange['field'], string>,
    allShown: _('Showing all %s entries'),
    oneShown: _('Showing 1 entry'),
    latestShown: _('Showing the %s most recent of %s entries'),
    loading: _('Loading activity'),
    errorTitle: _('Couldn’t load activity'),
    retry: _('Try again'),
    emptyTitle: _('No activity in this time range'),
    emptyDescription: _(
        'Activity lists the times the agent connected again and the apps it installed, uninstalled or failed to deploy. To see it, you need a role that can search the _dsclient and _dsappevent indexes, such as admin.',
    ),
};

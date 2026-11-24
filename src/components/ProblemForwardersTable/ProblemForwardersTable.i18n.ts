import { _ } from '@splunk/ui-utils/i18n';
import type { ForwarderColumn } from './ProblemForwardersTable.types';

export const messages = {
    title: _('Problem forwarders'),
    description: _('Forwarders that failed to deploy an app or reconnected in this time range'),
    forwarder: _('Forwarder'),
    host: _('Host'),
    version: _('Version'),
    columns: {
        failingApps: _('Failing apps'),
        failingHours: _('Failing hours'),
        reconnects: _('Reconnects'),
    } satisfies Record<ForwarderColumn, string>,
    tooltips: {
        failingApps: _('Apps whose last deployment in this time range failed'),
        failingHours: _('Hours in which at least one app failed to deploy'),
        reconnects: _('Times the forwarder connected to the deployment server again'),
    } satisfies Record<ForwarderColumn, string>,
    oneShown: _('Showing 1 forwarder'),
    allShown: _('Showing all %s forwarders'),
    topShown: _('Showing the top %s of %s forwarders'),
    loading: _('Loading problem forwarders'),
    errorTitle: _('Couldn’t load problem forwarders'),
    retry: _('Try again'),
    emptyTitle: _('No problem forwarders in this time range'),
    emptyDescription: _(
        'The table shows forwarders that fail to deploy an app or connect to the deployment server again. To see them, you need a role that can search the _dsappevent and _dsclient indexes, such as admin.',
    ),
};

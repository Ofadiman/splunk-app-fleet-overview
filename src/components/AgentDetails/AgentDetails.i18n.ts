import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    loading: _('Loading the agent'),
    errorTitle: _('Couldn’t load the agent'),
    retry: _('Try again'),
    notFoundTitle: _('No agent with this GUID'),
    notFoundDescription: _(
        'The deployment server indexes have no connection or phone home from this GUID. To see agents, you need a role that can search the _dsclient, _dsphonehome and _dsappevent indexes, such as admin.',
    ),
    host: _('Host'),
    ip: _('IP address'),
    version: _('Version'),
    versionWithBuild: _('%s (build %s)'),
    os: _('OS'),
    package: _('Package'),
    packageWithType: _('%s (%s)'),
    guid: _('GUID'),
    status: {
        phoningHome: _('Phoning home every %s. Last phone home %s.'),
        late: _('Late. Last phone home %s, usually every %s.'),
        silent: _('Silent since %s, %s.'),
        noInterval: _('Last phone home %s.'),
        none: _('No phone home in the last 7 days.'),
    },
};

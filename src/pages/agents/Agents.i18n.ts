import { _ } from '@splunk/ui-utils/i18n';

export const messages = {
    title: _('Agents'),
    overview: _('Overview'),
    noAgentTitle: _('No agent selected'),
    noAgentDescription: _(
        'Open an agent from the problem forwarders table on the overview page to see its details here.',
    ),
    invalidGuidTitle: _('“%s” isn’t an agent GUID'),
    invalidGuidDescription: _(
        'An agent GUID has 32 hexadecimal digits in five groups, such as F432A8B8-4ADB-42DE-9184-D79990A48FB0.',
    ),
};

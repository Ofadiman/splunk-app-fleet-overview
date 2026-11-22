import { _ } from '@splunk/ui-utils/i18n';
import type { Span } from './TimeRangeControls.types';

export const messages = {
    resolution: _('Resolution'),
    auto: _('Auto'),
    autoDescription: _('%s for this time range'),
    tooShort: _('Too many points for this time range'),
    tooLong: _('Too long for this time range'),
    timeParseError: _('Couldn’t read the time range'),
    spans: {
        '1m': _('1 minute'),
        '5m': _('5 minutes'),
        '15m': _('15 minutes'),
        '30m': _('30 minutes'),
        '1h': _('1 hour'),
        '6h': _('6 hours'),
        '1d': _('1 day'),
        '7d': _('1 week'),
    } satisfies Record<Span, string>,
    perSpan: {
        '1m': _('Per minute'),
        '5m': _('Per 5 minutes'),
        '15m': _('Per 15 minutes'),
        '30m': _('Per 30 minutes'),
        '1h': _('Per hour'),
        '6h': _('Per 6 hours'),
        '1d': _('Per day'),
        '7d': _('Per week'),
    } satisfies Record<Span, string>,
};

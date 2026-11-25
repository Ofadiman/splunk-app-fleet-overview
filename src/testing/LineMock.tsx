import type { ComponentProps } from 'react';
import Line from '#original-splunk-line';
import { fn } from '@vitest/spy';
import { componentDoublesEnabled } from './doubles';

export const lineMock = fn<(props: ComponentProps<typeof Line>) => null>(() => null);

export default function TestLine(props: ComponentProps<typeof Line>) {
    return componentDoublesEnabled() ? lineMock(props) : <Line {...props} />;
}

import type { ComponentProps } from 'react';
import Column from '#original-splunk-column';
import { fn } from '@vitest/spy';
import { componentDoublesEnabled } from './doubles';

export const columnMock = fn<(props: ComponentProps<typeof Column>) => null>(() => null);

export default function TestColumn(props: ComponentProps<typeof Column>) {
    return componentDoublesEnabled() ? columnMock(props) : <Column {...props} />;
}

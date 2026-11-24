import { cloneElement } from 'react';
import type { ReactElement } from 'react';
import presets from '@splunk/react-time-range/presets';

export const __esModule = true;

const SplunkwebConnectorMock = ({ children }: { children: ReactElement }) =>
    cloneElement(children, { presets });

export default SplunkwebConnectorMock;

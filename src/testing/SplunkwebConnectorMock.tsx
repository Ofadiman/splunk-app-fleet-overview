import { cloneElement } from 'react';
import type { ReactElement } from 'react';
import presets from '@splunk/react-time-range/presets';

const SplunkwebConnectorMock = ({ children }: { children: ReactElement }) =>
    cloneElement(children, { presets });

export default SplunkwebConnectorMock;

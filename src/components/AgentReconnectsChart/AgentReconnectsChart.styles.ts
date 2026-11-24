import styled from 'styled-components';
import { variables } from '@splunk/themes';
import { CHART_HEIGHT } from './AgentReconnectsChart.constants';

export const StyledLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${variables.spacingSmall};
    height: ${CHART_HEIGHT}px;
`;

import styled from 'styled-components';
import { variables } from '@splunk/themes';
import { CHART_HEIGHT } from './ConnectedForwardersChart.constants';

export const StyledLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${variables.spacingSmall};
    height: ${CHART_HEIGHT}px;
`;

export const StyledContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${variables.spacingMedium};
`;

import styled from 'styled-components';
import { variables } from '@splunk/themes';
import { LOADING_HEIGHT } from './ProblemForwardersTable.constants';

export const StyledContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${variables.spacingSmall};
`;

export const StyledLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${variables.spacingSmall};
    height: ${LOADING_HEIGHT}px;
`;

export const StyledUpdating = styled.span`
    display: inline-flex;
    align-items: center;
    gap: ${variables.spacingSmall};
`;

import styled from 'styled-components';
import { variables } from '@splunk/themes';

export const StyledPage = styled.div`
    position: relative;
    isolation: isolate;
    min-height: 100%;
    background-color: ${variables.backgroundColorPage};
`;

export const StyledContent = styled.div`
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${variables.spacingSmall};
    padding: ${variables.spacingXXLarge} ${variables.spacingXLarge};
`;

export const StyledCharts = styled.div`
    display: grid;
    align-self: stretch;
    margin-top: ${variables.spacingLarge};
`;

import styled from 'styled-components';
import { variables } from '@splunk/themes';
import Heading from '@splunk/react-ui/Heading';

export const StyledPage = styled.main`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    background-color: ${variables.backgroundColorPage};
`;

export const StyledContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${variables.spacingXLarge};
    max-width: 600px;
`;

export const StyledHeading = styled(Heading)`
    font-size: clamp(36px, 8vw, 68px);
`;

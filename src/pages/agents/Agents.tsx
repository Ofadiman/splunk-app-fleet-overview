import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import RouterLink from '../../components/RouterLink/RouterLink';
import { StyledContent, StyledPage } from './Agents.styles';

const Agents = () => (
    <StyledPage>
        <SpotLight variant="page-top" intensity="medium" />
        <StyledContent>
            <Heading level={1}>Agents</Heading>
            <RouterLink to="/home" appearance="standalone">
                Overview
            </RouterLink>
        </StyledContent>
    </StyledPage>
);

export default Agents;

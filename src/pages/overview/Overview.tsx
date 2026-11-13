import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import RouterLink from '../../components/RouterLink/RouterLink';
import { StyledContent, StyledPage } from './Overview.styles';

const Overview = () => (
    <StyledPage>
        <SpotLight variant="page-top" intensity="medium" />
        <StyledContent>
            <Heading level={1}>Overview</Heading>
            <RouterLink to="/agents" appearance="standalone">
                Agents
            </RouterLink>
        </StyledContent>
    </StyledPage>
);

export default Overview;

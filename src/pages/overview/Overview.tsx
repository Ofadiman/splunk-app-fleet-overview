import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import ConnectedForwardersChart from '../../components/ConnectedForwardersChart/ConnectedForwardersChart';
import RouterLink from '../../components/RouterLink/RouterLink';
import { StyledCharts, StyledContent, StyledPage } from './Overview.styles';

const Overview = () => (
    <StyledPage>
        <SpotLight variant="page-top" intensity="medium" />
        <StyledContent>
            <Heading level={1}>Overview</Heading>
            <RouterLink to="/agents" appearance="standalone">
                Agents
            </RouterLink>
            <StyledCharts>
                <ConnectedForwardersChart />
            </StyledCharts>
        </StyledContent>
    </StyledPage>
);

export default Overview;

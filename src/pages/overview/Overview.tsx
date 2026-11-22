import { useNavigate, useSearch } from '@tanstack/react-router';
import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import ConnectedForwardersChart from '../../components/ConnectedForwardersChart/ConnectedForwardersChart';
import DeploymentActivityChart from '../../components/DeploymentActivityChart/DeploymentActivityChart';
import ForwarderReconnectsChart from '../../components/ForwarderReconnectsChart/ForwarderReconnectsChart';
import RouterLink from '../../components/RouterLink/RouterLink';
import TimeRangeControls from '../../components/TimeRangeControls/TimeRangeControls';
import type { ChartTimeRange } from '../../components/TimeRangeControls/TimeRangeControls.types';
import { overviewSearchSchema } from './Overview.schema';
import { StyledCharts, StyledContent, StyledPage } from './Overview.styles';

const Overview = () => {
    const timeRange = overviewSearchSchema.parse(useSearch({ strict: false }));
    const navigate = useNavigate();

    const handleTimeRangeChange = (search: ChartTimeRange) => {
        void navigate({ to: '/overview', search });
    };

    return (
        <StyledPage>
            <SpotLight variant="page-top" intensity="medium" />
            <StyledContent>
                <Heading level={1}>Overview</Heading>
                <RouterLink to="/agents" appearance="standalone">
                    Agents
                </RouterLink>
                <TimeRangeControls value={timeRange} onChange={handleTimeRangeChange} />
                <StyledCharts>
                    <ConnectedForwardersChart timeRange={timeRange} />
                    <ForwarderReconnectsChart timeRange={timeRange} />
                    <DeploymentActivityChart timeRange={timeRange} />
                </StyledCharts>
            </StyledContent>
        </StyledPage>
    );
};

export default Overview;

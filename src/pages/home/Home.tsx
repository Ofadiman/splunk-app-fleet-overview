import { useNavigate, useSearch } from '@tanstack/react-router';
import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import ConnectedForwardersChart from '../../components/ConnectedForwardersChart/ConnectedForwardersChart';
import DeploymentActivityChart from '../../components/DeploymentActivityChart/DeploymentActivityChart';
import ForwarderReconnectsChart from '../../components/ForwarderReconnectsChart/ForwarderReconnectsChart';
import ProblemForwardersTable from '../../components/ProblemForwardersTable/ProblemForwardersTable';
import type { ForwarderSort } from '../../components/ProblemForwardersTable/ProblemForwardersTable.types';
import TimeRangeControls from '../../components/TimeRangeControls/TimeRangeControls';
import type { ChartTimeRange } from '../../components/TimeRangeControls/TimeRangeControls.types';
import { homeSearchSchema } from './Home.schema';
import { StyledCharts, StyledContent, StyledPage } from './Home.styles';

const Home = () => {
    const { sort, order, ...timeRange } = homeSearchSchema.parse(useSearch({ strict: false }));
    const navigate = useNavigate();

    const handleTimeRangeChange = (search: ChartTimeRange) => {
        void navigate({ to: '/home', search: { ...search, sort, order }, resetScroll: false });
    };

    const handleSortChange = ({ column, order: nextOrder }: ForwarderSort) => {
        void navigate({
            to: '/home',
            search: { ...timeRange, sort: column, order: nextOrder },
            resetScroll: false,
        });
    };

    return (
        <StyledPage>
            <SpotLight variant="page-top" intensity="medium" />
            <StyledContent>
                <Heading level={1}>Overview</Heading>
                <TimeRangeControls value={timeRange} onChange={handleTimeRangeChange} />
                <StyledCharts>
                    <ConnectedForwardersChart timeRange={timeRange} />
                    <ForwarderReconnectsChart timeRange={timeRange} />
                    <DeploymentActivityChart timeRange={timeRange} />
                    <ProblemForwardersTable
                        timeRange={timeRange}
                        sort={{ column: sort, order }}
                        onSortChange={handleSortChange}
                    />
                </StyledCharts>
            </StyledContent>
        </StyledPage>
    );
};

export default Home;

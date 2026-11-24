import { useNavigate, useSearch } from '@tanstack/react-router';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import SpotLight from '@splunk/react-ui/SpotLight';
import { sprintf } from '@splunk/ui-utils/format';
import AgentDetails from '../../components/AgentDetails/AgentDetails';
import RouterLink from '../../components/RouterLink/RouterLink';
import type { ChartTimeRange } from '../../components/TimeRangeControls/TimeRangeControls.types';
import { messages } from './Agents.i18n';
import { agentGuidSchema, agentsSearchSchema } from './Agents.schema';
import { StyledContent, StyledPage } from './Agents.styles';

const NoAgent = () => (
    <>
        <Heading level={1}>{messages.title}</Heading>
        <Message appearance="fill" type="info">
            <Message.Title>{messages.noAgentTitle}</Message.Title>
            <P>{messages.noAgentDescription}</P>
        </Message>
    </>
);

const InvalidGuid = ({ guid }: { guid: string }) => (
    <>
        <Heading level={1}>{messages.title}</Heading>
        <Message appearance="fill" type="error">
            <Message.Title>{sprintf(messages.invalidGuidTitle, guid)}</Message.Title>
            <P>{messages.invalidGuidDescription}</P>
        </Message>
    </>
);

const Agents = () => {
    const { guid, ...timeRange } = agentsSearchSchema.parse(useSearch({ strict: false }));
    const navigate = useNavigate();

    const handleTimeRangeChange = (search: ChartTimeRange) => {
        void navigate({ to: '/agents', search: { ...search, guid }, resetScroll: false });
    };

    const content = () => {
        if (guid === undefined) {
            return <NoAgent />;
        }
        if (!agentGuidSchema.safeParse(guid).success) {
            return <InvalidGuid guid={guid} />;
        }
        return (
            <AgentDetails
                key={guid}
                guid={guid}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
            />
        );
    };

    return (
        <StyledPage>
            <SpotLight variant="page-top" intensity="medium" />
            <StyledContent>
                <RouterLink to="/home" appearance="standalone">
                    {messages.overview}
                </RouterLink>
                {content()}
            </StyledContent>
        </StyledPage>
    );
};

export default Agents;

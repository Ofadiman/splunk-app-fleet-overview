import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Line from '@splunk/visualizations/Line';
import { CHART_HEIGHT, TIME_FIELD } from './ConnectedForwardersChart.constants';
import { useConnectedForwarders } from './ConnectedForwardersChart.hooks';
import { messages } from './ConnectedForwardersChart.i18n';
import { StyledLoading } from './ConnectedForwardersChart.styles';
import type { ChartContentProps } from './ConnectedForwardersChart.types';

const chartOptions = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'hide',
    yAxisTitleVisibility: 'hide',
    yAxisMin: 0,
};

const ChartContent = ({ state }: ChartContentProps) => {
    if (state.status === 'loading') {
        return (
            <StyledLoading>
                <WaitSpinner size="medium" screenReaderText={null} />
                {messages.loading}
            </StyledLoading>
        );
    }

    if (state.status === 'error') {
        return (
            <Message appearance="fill" type="error">
                <Message.Title>{messages.errorTitle}</Message.Title>
                <P>{state.message}</P>
            </Message>
        );
    }

    if (state.times.length === 0) {
        return (
            <Message appearance="fill" type="info">
                <Message.Title>{messages.emptyTitle}</Message.Title>
                <P>{messages.emptyDescription}</P>
            </Message>
        );
    }

    return (
        <Line
            mode="view"
            width="100%"
            height={CHART_HEIGHT}
            options={chartOptions}
            dataSources={{
                primary: {
                    requestParams: {},
                    meta: {},
                    data: {
                        fields: [TIME_FIELD, messages.seriesLabel],
                        columns: [state.times, state.counts],
                    },
                },
            }}
        />
    );
};

const ConnectedForwardersChart = () => {
    const state = useConnectedForwarders();

    return (
        <Card>
            <Card.Header
                title={<Heading level={2}>{messages.title}</Heading>}
                subtitle={messages.subtitle}
            />
            <Card.Body>
                <ChartContent state={state} />
            </Card.Body>
        </Card>
    );
};

export default ConnectedForwardersChart;

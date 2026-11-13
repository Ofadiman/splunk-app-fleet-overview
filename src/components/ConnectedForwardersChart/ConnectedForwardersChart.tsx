import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Line from '@splunk/visualizations/Line';
import { CHART_HEIGHT, TIME_FIELD } from './ConnectedForwardersChart.constants';
import { useConnectedForwarders } from './ConnectedForwardersChart.hooks';
import { messages } from './ConnectedForwardersChart.i18n';
import { StyledContent, StyledLoading } from './ConnectedForwardersChart.styles';

const chartOptions = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'hide',
    yAxisTitleVisibility: 'hide',
    yAxisMin: 0,
};

const ChartContent = () => {
    const { data, error, isPending, isLoadingError, isRefetchError } = useConnectedForwarders();

    if (isPending) {
        return (
            <StyledLoading>
                <WaitSpinner size="medium" screenReaderText={null} />
                {messages.loading}
            </StyledLoading>
        );
    }

    if (isLoadingError) {
        return (
            <Message appearance="fill" type="error">
                <Message.Title>{messages.errorTitle}</Message.Title>
                <P>{error.message}</P>
            </Message>
        );
    }

    return (
        <StyledContent>
            {isRefetchError && (
                <Message appearance="fill" type="warning">
                    <Message.Title>{messages.refreshErrorTitle}</Message.Title>
                    <P>{error.message}</P>
                </Message>
            )}
            {data.times.length === 0 ? (
                <Message appearance="fill" type="info">
                    <Message.Title>{messages.emptyTitle}</Message.Title>
                    <P>{messages.emptyDescription}</P>
                </Message>
            ) : (
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
                                columns: [data.times, data.counts],
                            },
                        },
                    }}
                />
            )}
        </StyledContent>
    );
};

const ConnectedForwardersChart = () => (
    <Card>
        <Card.Header
            title={<Heading level={2}>{messages.title}</Heading>}
            subtitle={messages.subtitle}
        />
        <Card.Body>
            <ChartContent />
        </Card.Body>
    </Card>
);

export default ConnectedForwardersChart;

import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Line from '@splunk/visualizations/Line';
import { CHART_HEIGHT, TIME_FIELD } from './ConnectedForwardersChart.constants';
import { useChartSpan } from '../TimeRangeControls/TimeRangeControls.hooks';
import { useConnectedForwarders } from './ConnectedForwardersChart.hooks';
import { messages } from './ConnectedForwardersChart.i18n';
import { StyledLoading } from './ConnectedForwardersChart.styles';
import type { ConnectedForwardersChartProps } from './ConnectedForwardersChart.types';

const chartOptions = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'hide',
    yAxisTitleVisibility: 'hide',
    yAxisMin: 0,
};

const ChartLoading = () => (
    <StyledLoading>
        <WaitSpinner size="medium" screenReaderText={null} />
        {messages.loading}
    </StyledLoading>
);

const ChartError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const ChartContent = ({ timeRange }: ConnectedForwardersChartProps) => {
    const span = useChartSpan(timeRange);
    const { data } = useConnectedForwarders({
        earliest: timeRange.earliest,
        latest: timeRange.latest,
        span,
    });

    if (data.times.length === 0) {
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
                        columns: [data.times, data.counts],
                    },
                },
            }}
        />
    );
};

const ConnectedForwardersChart = ({ timeRange }: ConnectedForwardersChartProps) => {
    return (
        <Card>
            <Card.Header
                title={<Heading level={2}>{messages.title}</Heading>}
                subtitle={messages.description}
            />
            <Card.Body>
                <QueryErrorResetBoundary>
                    {({ reset }) => (
                        <ErrorBoundary onReset={reset} FallbackComponent={ChartError}>
                            <Suspense fallback={<ChartLoading />}>
                                <ChartContent timeRange={timeRange} />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </QueryErrorResetBoundary>
            </Card.Body>
        </Card>
    );
};

export default ConnectedForwardersChart;

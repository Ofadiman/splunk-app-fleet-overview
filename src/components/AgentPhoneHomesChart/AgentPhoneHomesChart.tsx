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
import Column from '@splunk/visualizations/Column';
import { useChartSpan } from '../TimeRangeControls/TimeRangeControls.hooks';
import { CHART_HEIGHT, TIME_FIELD } from './AgentPhoneHomesChart.constants';
import { useAgentPhoneHomes } from './AgentPhoneHomesChart.hooks';
import { messages } from './AgentPhoneHomesChart.i18n';
import { StyledLoading } from './AgentPhoneHomesChart.styles';
import type { AgentPhoneHomesChartProps } from './AgentPhoneHomesChart.types';
import { yAxisTickInterval } from './AgentPhoneHomesChart.utils';

const chartOptions = (counts: string[]) => ({
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'hide',
    yAxisTitleVisibility: 'hide',
    yAxisMin: 0,
    yAxisMajorTickInterval: yAxisTickInterval(Math.max(...counts.map(Number))),
});

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

const ChartContent = ({ guid, timeRange }: AgentPhoneHomesChartProps) => {
    const span = useChartSpan(timeRange);
    const { data } = useAgentPhoneHomes({
        guid,
        earliest: timeRange.earliest,
        latest: timeRange.latest,
        span,
    });

    if (!data.counts.some((count) => Number(count) > 0)) {
        return (
            <Message appearance="fill" type="info">
                <Message.Title>{messages.emptyTitle}</Message.Title>
                <P>{messages.emptyDescription}</P>
            </Message>
        );
    }

    return (
        <Column
            mode="view"
            width="100%"
            height={CHART_HEIGHT}
            options={chartOptions(data.counts)}
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

const AgentPhoneHomesChart = ({ guid, timeRange }: AgentPhoneHomesChartProps) => (
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
                            <ChartContent guid={guid} timeRange={timeRange} />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Card.Body>
    </Card>
);

export default AgentPhoneHomesChart;

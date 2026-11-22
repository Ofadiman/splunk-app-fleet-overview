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
import getTheme from '@splunk/themes/getTheme';
import useSplunkTheme from '@splunk/themes/useSplunkTheme';
import Column from '@splunk/visualizations/Column';
import { CHART_HEIGHT, TIME_FIELD } from './DeploymentActivityChart.constants';
import { useChartSpan } from '../TimeRangeControls/TimeRangeControls.hooks';
import { useDeploymentActivity } from './DeploymentActivityChart.hooks';
import { messages } from './DeploymentActivityChart.i18n';
import { StyledLoading } from './DeploymentActivityChart.styles';
import type { DeploymentActivityChartProps } from './DeploymentActivityChart.types';
import { yAxisTickInterval } from './DeploymentActivityChart.utils';

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

const ChartContent = ({ timeRange }: DeploymentActivityChartProps) => {
    const span = useChartSpan(timeRange);
    const { data } = useDeploymentActivity({
        earliest: timeRange.earliest,
        latest: timeRange.latest,
        span,
    });
    const { colorScheme } = useSplunkTheme();
    const { severityColorNormal, severityColorInfo, severityColorCritical } = getTheme({
        family: 'prisma',
        colorScheme,
    });
    const totals = data.installed.map(
        (installed, index) =>
            Number(installed) + Number(data.uninstalled[index]) + Number(data.failed[index]),
    );
    const highestTotal = Math.max(0, ...totals);

    if (highestTotal === 0) {
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
            options={{
                backgroundColor: 'transparent',
                legendDisplay: 'bottom',
                xAxisTitleVisibility: 'hide',
                yAxisTitleVisibility: 'hide',
                yAxisMin: 0,
                yAxisMajorTickInterval: yAxisTickInterval(highestTotal),
                stackMode: 'stacked',
                seriesColorsByField: {
                    [messages.installedLabel]: severityColorNormal,
                    [messages.uninstalledLabel]: severityColorInfo,
                    [messages.failedLabel]: severityColorCritical,
                },
            }}
            dataSources={{
                primary: {
                    requestParams: {},
                    meta: {},
                    data: {
                        fields: [
                            TIME_FIELD,
                            messages.installedLabel,
                            messages.uninstalledLabel,
                            messages.failedLabel,
                        ],
                        columns: [data.times, data.installed, data.uninstalled, data.failed],
                    },
                },
            }}
        />
    );
};

const DeploymentActivityChart = ({ timeRange }: DeploymentActivityChartProps) => {
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

export default DeploymentActivityChart;

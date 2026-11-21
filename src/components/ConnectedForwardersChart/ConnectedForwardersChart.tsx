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
import Line from '@splunk/visualizations/Line';
import {
    CHART_HEIGHT,
    MARKER_COLOR_FIELD,
    MARKER_LABEL_FIELD,
    TIME_FIELD,
} from './ConnectedForwardersChart.constants';
import { useConnectedForwarders, useMarkerSources } from './ConnectedForwardersChart.hooks';
import { messages } from './ConnectedForwardersChart.i18n';
import { StyledLoading } from './ConnectedForwardersChart.styles';
import { buildMarkers } from './ConnectedForwardersChart.utils';

const chartOptions = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'hide',
    yAxisTitleVisibility: 'hide',
    yAxisMin: 0,
};

const markerOptions = {
    annotationX: '> annotation|seriesByIndex(0)',
    annotationLabel: '> annotation|seriesByIndex(1)',
    annotationColor: '> annotation|seriesByIndex(2)',
};

const markerLabels = {
    installed: messages.installedMarker,
    uninstalled: messages.uninstalledMarker,
    failed: messages.failedMarker,
    reconnects: messages.reconnectsMarker,
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

const ChartContent = () => {
    const { data } = useConnectedForwarders();
    const { deployments, reconnects } = useMarkerSources();
    const { colorScheme } = useSplunkTheme();
    const { severityColorCritical, severityColorUnknown } = getTheme({
        family: 'prisma',
        colorScheme,
    });

    if (data.times.length === 0) {
        return (
            <Message appearance="fill" type="info">
                <Message.Title>{messages.emptyTitle}</Message.Title>
                <P>{messages.emptyDescription}</P>
            </Message>
        );
    }

    const markers = buildMarkers(data, deployments, reconnects, markerLabels, {
        failure: severityColorCritical,
        change: severityColorUnknown,
    });
    const hasMarkers = markers.times.length > 0;

    return (
        <Line
            mode="view"
            width="100%"
            height={CHART_HEIGHT}
            options={hasMarkers ? { ...chartOptions, ...markerOptions } : chartOptions}
            dataSources={{
                primary: {
                    requestParams: {},
                    meta: {},
                    data: {
                        fields: [TIME_FIELD, messages.seriesLabel],
                        columns: [data.times, data.counts],
                    },
                },
                ...(hasMarkers && {
                    annotation: {
                        requestParams: {},
                        meta: {},
                        data: {
                            fields: [TIME_FIELD, MARKER_LABEL_FIELD, MARKER_COLOR_FIELD],
                            columns: [markers.times, markers.labels, markers.colors],
                        },
                    },
                }),
            }}
        />
    );
};

const ConnectedForwardersChart = () => (
    <Card>
        <Card.Header
            title={<Heading level={2}>{messages.title}</Heading>}
            subtitle={messages.subtitle}
        />
        <Card.Body>
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary onReset={reset} FallbackComponent={ChartError}>
                        <Suspense fallback={<ChartLoading />}>
                            <ChartContent />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Card.Body>
    </Card>
);

export default ConnectedForwardersChart;

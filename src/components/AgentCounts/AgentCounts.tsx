import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import DL from '@splunk/react-ui/DefinitionList';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { locale } from '@splunk/splunk-utils/config';
import { useAgentCounts } from './AgentCounts.hooks';
import { messages } from './AgentCounts.i18n';
import { StyledLoading } from './AgentCounts.styles';
import type { AgentCountsProps } from './AgentCounts.types';

const numberFormat = new Intl.NumberFormat(locale);

const CountsLoading = () => (
    <StyledLoading>
        <WaitSpinner size="medium" screenReaderText={null} />
        {messages.loading}
    </StyledLoading>
);

const CountsError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const CountsContent = ({ guid, timeRange }: AgentCountsProps) => {
    const { data } = useAgentCounts({
        guid,
        earliest: timeRange.earliest,
        latest: timeRange.latest,
    });

    return (
        <DL layout="fixed" termWidth="120px">
            <DL.Term>{messages.failingApps}</DL.Term>
            <DL.Description>{numberFormat.format(data.failingApps)}</DL.Description>
            <DL.Term>{messages.failingHours}</DL.Term>
            <DL.Description>{numberFormat.format(data.failingHours)}</DL.Description>
            <DL.Term>{messages.reconnects}</DL.Term>
            <DL.Description>{numberFormat.format(data.reconnects)}</DL.Description>
        </DL>
    );
};

const AgentCounts = ({ guid, timeRange }: AgentCountsProps) => (
    <Card>
        <Card.Header
            title={<Heading level={2}>{messages.title}</Heading>}
            subtitle={messages.description}
        />
        <Card.Body>
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary onReset={reset} FallbackComponent={CountsError}>
                        <Suspense fallback={<CountsLoading />}>
                            <CountsContent guid={guid} timeRange={timeRange} />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Card.Body>
    </Card>
);

export default AgentCounts;

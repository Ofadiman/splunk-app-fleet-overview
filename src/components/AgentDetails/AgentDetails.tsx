import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import CheckCircle from '@splunk/react-icons/CheckCircle';
import CrossCircle from '@splunk/react-icons/CrossCircle';
import ExclamationTriangle from '@splunk/react-icons/ExclamationTriangle';
import MinusCircle from '@splunk/react-icons/MinusCircle';
import Button from '@splunk/react-ui/Button';
import DL from '@splunk/react-ui/DefinitionList';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { sprintf } from '@splunk/ui-utils/format';
import { formatDuration, formatTime, formatTimeAgo } from '../../formatTime';
import AgentActivity from '../AgentActivity/AgentActivity';
import AgentAppsTable from '../AgentAppsTable/AgentAppsTable';
import AgentCounts from '../AgentCounts/AgentCounts';
import AgentPhoneHomesChart from '../AgentPhoneHomesChart/AgentPhoneHomesChart';
import AgentReconnectsChart from '../AgentReconnectsChart/AgentReconnectsChart';
import TimeRangeControls from '../TimeRangeControls/TimeRangeControls';
import { MISSING_VALUE } from './AgentDetails.constants';
import { useAgentSummary } from './AgentDetails.hooks';
import { messages } from './AgentDetails.i18n';
import { StyledDetails, StyledLoading, StyledSections, StyledStatus } from './AgentDetails.styles';
import type { AgentDetailsProps, AgentSummary, PhoneHomeStatus } from './AgentDetails.types';
import { phoneHomeStatus } from './AgentDetails.utils';

const statusIcons: Record<PhoneHomeStatus, typeof CheckCircle> = {
    phoningHome: CheckCircle,
    late: ExclamationTriangle,
    silent: CrossCircle,
    noInterval: MinusCircle,
    none: MinusCircle,
};

const statusText = (status: PhoneHomeStatus, { lastPhoneHome = 0, interval = 0 }: AgentSummary) => {
    switch (status) {
        case 'phoningHome':
            return sprintf(
                messages.status.phoningHome,
                formatDuration(interval),
                formatTimeAgo(lastPhoneHome),
            );
        case 'late':
            return sprintf(
                messages.status.late,
                formatTimeAgo(lastPhoneHome),
                formatDuration(interval),
            );
        case 'silent':
            return sprintf(
                messages.status.silent,
                formatTime(lastPhoneHome),
                formatTimeAgo(lastPhoneHome),
            );
        case 'noInterval':
            return sprintf(messages.status.noInterval, formatTimeAgo(lastPhoneHome));
        case 'none':
            return messages.status.none;
    }
};

const joined = (format: string, first?: string, second?: string) => {
    if (first && second) {
        return sprintf(format, first, second);
    }
    return first ?? MISSING_VALUE;
};

const PhoneHomeLine = ({ summary }: { summary: AgentSummary }) => {
    const status = phoneHomeStatus(summary, Date.now() / 1000);
    const Icon = statusIcons[status];

    return (
        <StyledStatus $status={status}>
            <Icon />
            {statusText(status, summary)}
        </StyledStatus>
    );
};

const Identity = ({ guid, summary }: { guid: string; summary: AgentSummary }) => (
    <DL layout="fixed" termWidth="120px">
        <DL.Term>{messages.host}</DL.Term>
        <DL.Description>{summary.host ?? MISSING_VALUE}</DL.Description>
        <DL.Term>{messages.ip}</DL.Term>
        <DL.Description>{summary.ip ?? MISSING_VALUE}</DL.Description>
        <DL.Term>{messages.version}</DL.Term>
        <DL.Description>
            {joined(messages.versionWithBuild, summary.version, summary.build)}
        </DL.Description>
        <DL.Term>{messages.os}</DL.Term>
        <DL.Description>{summary.os ?? MISSING_VALUE}</DL.Description>
        <DL.Term>{messages.package}</DL.Term>
        <DL.Description>
            {joined(messages.packageWithType, summary.package, summary.packageType)}
        </DL.Description>
        <DL.Term>{messages.guid}</DL.Term>
        <DL.Description>{guid}</DL.Description>
    </DL>
);

const DetailsLoading = ({ guid }: { guid: string }) => (
    <>
        <Heading level={1}>{guid}</Heading>
        <StyledLoading>
            <WaitSpinner size="medium" screenReaderText={null} />
            {messages.loading}
        </StyledLoading>
    </>
);

const DetailsError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const DetailsContent = ({ guid, timeRange, onTimeRangeChange }: AgentDetailsProps) => {
    const { data: summary } = useAgentSummary(guid);

    if (!summary) {
        return (
            <>
                <Heading level={1}>{guid}</Heading>
                <Message appearance="fill" type="info">
                    <Message.Title>{messages.notFoundTitle}</Message.Title>
                    <P>{messages.notFoundDescription}</P>
                </Message>
            </>
        );
    }

    return (
        <>
            <Heading level={1}>{summary.name ?? guid}</Heading>
            <PhoneHomeLine summary={summary} />
            <Identity guid={guid} summary={summary} />
            <TimeRangeControls value={timeRange} onChange={onTimeRangeChange} />
            <StyledSections>
                <AgentCounts guid={guid} timeRange={timeRange} />
                <AgentPhoneHomesChart guid={guid} timeRange={timeRange} />
                <AgentReconnectsChart guid={guid} timeRange={timeRange} />
                <AgentAppsTable guid={guid} />
                <AgentActivity guid={guid} timeRange={timeRange} />
            </StyledSections>
        </>
    );
};

const AgentDetails = ({ guid, timeRange, onTimeRangeChange }: AgentDetailsProps) => (
    <StyledDetails>
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary onReset={reset} FallbackComponent={DetailsError}>
                    <Suspense fallback={<DetailsLoading guid={guid} />}>
                        <DetailsContent
                            guid={guid}
                            timeRange={timeRange}
                            onTimeRangeChange={onTimeRangeChange}
                        />
                    </Suspense>
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    </StyledDetails>
);

export default AgentDetails;

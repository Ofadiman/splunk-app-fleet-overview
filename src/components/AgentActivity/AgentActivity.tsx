import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import Table from '@splunk/react-ui/Table';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { locale } from '@splunk/splunk-utils/config';
import { sprintf } from '@splunk/ui-utils/format';
import { formatTime } from '../../formatTime';
import { COLUMN_WIDTHS, OK_RESULT } from './AgentActivity.constants';
import { useAgentActivity } from './AgentActivity.hooks';
import { messages } from './AgentActivity.i18n';
import { StyledContent, StyledLoading } from './AgentActivity.styles';
import type {
    ActivityEntry,
    AgentActivityProps,
    AgentActivityResults,
} from './AgentActivity.types';
import { appAction, identityChanges } from './AgentActivity.utils';

const numberFormat = new Intl.NumberFormat(locale);

const entryTime = ({ first, last }: ActivityEntry) =>
    first === last
        ? formatTime(last)
        : sprintf(messages.timeSpan, formatTime(first), formatTime(last));

const appEventText = ({ app = '', action, result, times }: ActivityEntry) => {
    const known = appAction(action);
    const count = numberFormat.format(times);
    if (!known) {
        return sprintf(messages.otherEvent, app, action ?? '', result ?? '');
    }
    if (result === OK_RESULT) {
        return times === 1
            ? sprintf(messages.succeeded[known], app)
            : sprintf(messages.succeededTimes[known], app, count);
    }
    return times === 1
        ? sprintf(messages.failed[known], app)
        : sprintf(messages.failedTimes[known], app, count);
};

const eventText = (entry: ActivityEntry) => {
    if (entry.kind === 'app') {
        return appEventText(entry);
    }
    return entry.times === 1
        ? messages.reconnected
        : sprintf(messages.reconnectedTimes, numberFormat.format(entry.times));
};

const EntryDetails = ({ entry }: { entry: ActivityEntry }) => {
    if (entry.kind === 'app') {
        return entry.reason ?? null;
    }
    return identityChanges(entry).map(({ field, from, to }) => (
        <div key={field}>{sprintf(messages.changes[field], from, to)}</div>
    ));
};

const shownText = ({ entries, total }: AgentActivityResults) => {
    if (entries.length < total) {
        return sprintf(
            messages.latestShown,
            numberFormat.format(entries.length),
            numberFormat.format(total),
        );
    }
    return total === 1 ? messages.oneShown : sprintf(messages.allShown, numberFormat.format(total));
};

const ActivityLoading = () => (
    <StyledLoading>
        <WaitSpinner size="medium" screenReaderText={null} />
        {messages.loading}
    </StyledLoading>
);

const ActivityError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const ActivityContent = ({ guid, timeRange }: AgentActivityProps) => {
    const { data } = useAgentActivity({
        guid,
        earliest: timeRange.earliest,
        latest: timeRange.latest,
    });

    if (data.total === 0) {
        return (
            <Message appearance="fill" type="info">
                <Message.Title>{messages.emptyTitle}</Message.Title>
                <P>{messages.emptyDescription}</P>
            </Message>
        );
    }

    return (
        <StyledContent>
            <P>{shownText(data)}</P>
            <Table stripeRows>
                <Table.Head>
                    <Table.HeadCell width={COLUMN_WIDTHS.time}>{messages.time}</Table.HeadCell>
                    <Table.HeadCell width={COLUMN_WIDTHS.event}>{messages.event}</Table.HeadCell>
                    <Table.HeadCell>{messages.details}</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {data.entries.map((entry) => (
                        <Table.Row key={`${entry.kind} ${entry.app ?? ''} ${entry.first}`}>
                            <Table.Cell>{entryTime(entry)}</Table.Cell>
                            <Table.Cell>{eventText(entry)}</Table.Cell>
                            <Table.Cell>
                                <EntryDetails entry={entry} />
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </StyledContent>
    );
};

const AgentActivity = ({ guid, timeRange }: AgentActivityProps) => (
    <Card>
        <Card.Header
            title={<Heading level={2}>{messages.title}</Heading>}
            subtitle={messages.description}
        />
        <Card.Body>
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary onReset={reset} FallbackComponent={ActivityError}>
                        <Suspense fallback={<ActivityLoading />}>
                            <ActivityContent guid={guid} timeRange={timeRange} />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Card.Body>
    </Card>
);

export default AgentActivity;

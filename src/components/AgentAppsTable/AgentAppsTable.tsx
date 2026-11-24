import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import CheckCircle from '@splunk/react-icons/CheckCircle';
import CrossCircle from '@splunk/react-icons/CrossCircle';
import MinusCircle from '@splunk/react-icons/MinusCircle';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import Table from '@splunk/react-ui/Table';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { formatTime } from '../../formatTime';
import { COLUMN_WIDTHS, MISSING_VALUE } from './AgentAppsTable.constants';
import { useAgentApps } from './AgentAppsTable.hooks';
import { messages } from './AgentAppsTable.i18n';
import { StyledLoading, StyledStatus } from './AgentAppsTable.styles';
import type { AgentAppsTableProps, AppStatus } from './AgentAppsTable.types';

const statusIcons: Record<AppStatus, typeof CheckCircle> = {
    failing: CrossCircle,
    installed: CheckCircle,
    uninstalled: MinusCircle,
    downloaded: MinusCircle,
};

const timeOrMissing = (time?: number) => (time === undefined ? MISSING_VALUE : formatTime(time));

const AppStatusCell = ({ status }: { status: AppStatus }) => {
    const Icon = statusIcons[status];
    return (
        <StyledStatus $status={status}>
            <Icon />
            {messages.statuses[status]}
        </StyledStatus>
    );
};

const TableLoading = () => (
    <StyledLoading>
        <WaitSpinner size="medium" screenReaderText={null} />
        {messages.loading}
    </StyledLoading>
);

const TableError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const TableContent = ({ guid }: AgentAppsTableProps) => {
    const { data: apps } = useAgentApps(guid);

    if (apps.length === 0) {
        return (
            <Message appearance="fill" type="info">
                <Message.Title>{messages.emptyTitle}</Message.Title>
                <P>{messages.emptyDescription}</P>
            </Message>
        );
    }

    return (
        <Table stripeRows>
            <Table.Head>
                <Table.HeadCell width={COLUMN_WIDTHS.app}>{messages.app}</Table.HeadCell>
                <Table.HeadCell width={COLUMN_WIDTHS.serverClass}>
                    {messages.serverClass}
                </Table.HeadCell>
                <Table.HeadCell width={COLUMN_WIDTHS.status}>{messages.status}</Table.HeadCell>
                <Table.HeadCell width={COLUMN_WIDTHS.time} tooltip={messages.lastSuccessTooltip}>
                    {messages.lastSuccess}
                </Table.HeadCell>
                <Table.HeadCell width={COLUMN_WIDTHS.time} tooltip={messages.failingSinceTooltip}>
                    {messages.failingSince}
                </Table.HeadCell>
                <Table.HeadCell>{messages.reason}</Table.HeadCell>
            </Table.Head>
            <Table.Body>
                {apps.map((app) => (
                    <Table.Row key={`${app.serverClass} ${app.app}`}>
                        <Table.Cell>{app.app}</Table.Cell>
                        <Table.Cell>{app.serverClass}</Table.Cell>
                        <Table.Cell>
                            <AppStatusCell status={app.status} />
                        </Table.Cell>
                        <Table.Cell>{timeOrMissing(app.lastSuccess)}</Table.Cell>
                        <Table.Cell>{timeOrMissing(app.failingSince)}</Table.Cell>
                        <Table.Cell>{app.reason ?? MISSING_VALUE}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
};

const AgentAppsTable = ({ guid }: AgentAppsTableProps) => (
    <Card>
        <Card.Header
            title={<Heading level={2}>{messages.title}</Heading>}
            subtitle={messages.description}
        />
        <Card.Body>
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary onReset={reset} FallbackComponent={TableError}>
                        <Suspense fallback={<TableLoading />}>
                            <TableContent guid={guid} />
                        </Suspense>
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </Card.Body>
    </Card>
);

export default AgentAppsTable;

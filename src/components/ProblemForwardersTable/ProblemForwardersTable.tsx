import { Suspense, useDeferredValue } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import P from '@splunk/react-ui/Paragraph';
import Table from '@splunk/react-ui/Table';
import type { HeadCellSortHandler } from '@splunk/react-ui/Table';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { locale } from '@splunk/splunk-utils/config';
import { sprintf } from '@splunk/ui-utils/format';
import {
    FORWARDER_COLUMNS,
    MISSING_VALUE,
    TABLE_MAX_HEIGHT,
} from './ProblemForwardersTable.constants';
import { useProblemForwarders, useScrollToTopOnSort } from './ProblemForwardersTable.hooks';
import { messages } from './ProblemForwardersTable.i18n';
import { forwarderColumnSchema } from './ProblemForwardersTable.schema';
import { StyledContent, StyledLoading, StyledUpdating } from './ProblemForwardersTable.styles';
import type {
    ForwarderSortProps,
    ForwardersTableProps,
    ProblemForwarders,
    ProblemForwardersTableProps,
} from './ProblemForwardersTable.types';

const numberFormat = new Intl.NumberFormat(locale);

const shownText = ({ forwarders, total }: ProblemForwarders) => {
    if (forwarders.length < total) {
        return sprintf(
            messages.topShown,
            numberFormat.format(forwarders.length),
            numberFormat.format(total),
        );
    }
    return total === 1 ? messages.oneShown : sprintf(messages.allShown, numberFormat.format(total));
};

const ForwardersTable = ({ forwarders, sort, onSortChange, onScroll }: ForwardersTableProps) => {
    const handleSort: HeadCellSortHandler = (_event, { sortKey }) => {
        const selected = forwarderColumnSchema.safeParse(sortKey);
        if (selected.success) {
            const reverses = selected.data === sort.column && sort.order === 'desc';
            onSortChange({ column: selected.data, order: reverses ? 'asc' : 'desc' });
        }
    };

    return (
        <Table
            headType="fixed"
            innerStyle={{ maxHeight: TABLE_MAX_HEIGHT }}
            onScroll={onScroll}
            stripeRows
        >
            <Table.Head>
                <Table.HeadCell>{messages.forwarder}</Table.HeadCell>
                <Table.HeadCell>{messages.host}</Table.HeadCell>
                <Table.HeadCell>{messages.version}</Table.HeadCell>
                {FORWARDER_COLUMNS.map((column) => (
                    <Table.HeadCell
                        key={column}
                        align="right"
                        sortKey={column}
                        sortDir={column === sort.column ? sort.order : 'none'}
                        onSort={handleSort}
                        tooltip={messages.tooltips[column]}
                    >
                        {messages.columns[column]}
                    </Table.HeadCell>
                ))}
            </Table.Head>
            <Table.Body>
                {forwarders.map((forwarder) => (
                    <Table.Row key={forwarder.clientId}>
                        <Table.Cell>{forwarder.name ?? MISSING_VALUE}</Table.Cell>
                        <Table.Cell>{forwarder.host ?? MISSING_VALUE}</Table.Cell>
                        <Table.Cell>{forwarder.version ?? MISSING_VALUE}</Table.Cell>
                        {FORWARDER_COLUMNS.map((column) => (
                            <Table.Cell key={column} align="right">
                                {numberFormat.format(forwarder[column])}
                            </Table.Cell>
                        ))}
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
};

const TableLoading = ({ sort, onSortChange }: ForwarderSortProps) => (
    <StyledContent>
        <ForwardersTable forwarders={[]} sort={sort} onSortChange={onSortChange} />
        <StyledLoading>
            <WaitSpinner size="medium" screenReaderText={null} />
            {messages.loading}
        </StyledLoading>
    </StyledContent>
);

const TableError = ({ error, resetErrorBoundary }: FallbackProps) => (
    <Message appearance="fill" type="error">
        <Message.Title>{messages.errorTitle}</Message.Title>
        <P>{getErrorMessage(error)}</P>
        <Button appearance="secondary" label={messages.retry} onClick={resetErrorBoundary} />
    </Message>
);

const TableContent = ({ timeRange, sort, onSortChange }: ProblemForwardersTableProps) => {
    const column = useDeferredValue(sort.column);
    const order = useDeferredValue(sort.order);
    const updating = column !== sort.column || order !== sort.order;
    const { data } = useProblemForwarders({
        earliest: timeRange.earliest,
        latest: timeRange.latest,
        column,
        order,
    });
    const handleListScroll = useScrollToTopOnSort({ column, order });

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
            <P>
                {updating ? (
                    <StyledUpdating>
                        <WaitSpinner screenReaderText={null} />
                        {messages.loading}
                    </StyledUpdating>
                ) : (
                    shownText(data)
                )}
            </P>
            <ForwardersTable
                forwarders={data.forwarders}
                sort={sort}
                onSortChange={onSortChange}
                onScroll={handleListScroll}
            />
        </StyledContent>
    );
};

const ProblemForwardersTable = ({ timeRange, sort, onSortChange }: ProblemForwardersTableProps) => {
    return (
        <Card>
            <Card.Header
                title={<Heading level={2}>{messages.title}</Heading>}
                subtitle={messages.description}
            />
            <Card.Body>
                <QueryErrorResetBoundary>
                    {({ reset }) => (
                        <ErrorBoundary onReset={reset} FallbackComponent={TableError}>
                            <Suspense
                                fallback={<TableLoading sort={sort} onSortChange={onSortChange} />}
                            >
                                <TableContent
                                    timeRange={timeRange}
                                    sort={sort}
                                    onSortChange={onSortChange}
                                />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </QueryErrorResetBoundary>
            </Card.Body>
        </Card>
    );
};

export default ProblemForwardersTable;

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { oneShot } from '@splunk/splunk-utils/search';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDuration, formatTime, formatTimeAgo } from '../../formatTime';
import { HOUR_SECONDS, mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import type { ChartTimeRange } from '../TimeRangeControls/TimeRangeControls.types';
import AgentDetails from './AgentDetails';

vi.mock('@splunk/splunk-utils/search', () => ({ oneShot: vi.fn() }));
vi.mock('@splunk/visualizations/Column', () => ({
    __esModule: true,
    default: vi.fn(() => null),
}));
vi.mock(
    '@splunk/react-time-range/SplunkwebConnector',
    () => import('../../testing/SplunkwebConnectorMock'),
);

const guid = '316BB7CA-93DC-4C3C-BE06-D154E9A38A0C';

const timeRange: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const secondsAgo = (seconds: number) => Math.floor(Date.now() / 1000) - seconds;

const identity = {
    name: 'triss',
    host: 'triss.splunk.com',
    ip: '172.18.0.7',
    version: '10.0.7',
    build: 'd24b16fd5f20',
    os: 'linux-x86_64',
    package: 'universal_forwarder',
    packageType: 'tgz',
};

const isSummarySearch = (params: unknown) =>
    String((params as { search: string }).search).includes('values(data.lastPhoneHomeTime)');

const answerSummaryWith = (summary: Promise<unknown>) =>
    vi
        .mocked(oneShot)
        .mockImplementation((params) =>
            isSummarySearch(params) ? summary : new Promise(() => {}),
        );

const summaryResults = (row?: Record<string, string | number>) => ({
    preview: false,
    init_offset: 0,
    messages: [],
    fields: [],
    results: row ? [row] : [],
});

const renderDetails = (onTimeRangeChange = vi.fn()) =>
    renderWithQueryClient(
        <AgentDetails guid={guid} timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />,
    );

const valueOf = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

const silenceErrorBoundaryLogs = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AgentDetails', () => {
    beforeEach(() => {
        mockTimeParser();
        vi.mocked(oneShot).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the GUID and a loading message while the search runs', async () => {
        answerSummaryWith(new Promise(() => {}));

        renderDetails();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(screen.getByRole('heading', { level: 1, name: guid })).toBeVisible();
        expect(screen.getByText('Loading the agent')).toBeInTheDocument();
    });

    it('shows the name of the agent and who it is', async () => {
        answerSummaryWith(Promise.resolve(summaryResults(identity)));

        renderDetails();

        expect(await screen.findByRole('heading', { level: 1, name: 'triss' })).toBeVisible();
        expect(valueOf('Host')).toBe('triss.splunk.com');
        expect(valueOf('IP address')).toBe('172.18.0.7');
        expect(valueOf('Version')).toBe('10.0.7 (build d24b16fd5f20)');
        expect(valueOf('OS')).toBe('linux-x86_64');
        expect(valueOf('Package')).toBe('universal_forwarder (tgz)');
        expect(valueOf('GUID')).toBe(guid);
    });

    it('shows the GUID and dashes when the agent never connected in the last 60 days', async () => {
        answerSummaryWith(Promise.resolve(summaryResults({ lastPhoneHome: secondsAgo(60) })));

        renderDetails();

        expect(await screen.findByText('Host')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: guid })).toBeVisible();
        expect(valueOf('Host')).toBe('—');
        expect(valueOf('Version')).toBe('—');
    });

    it('says how often the agent phones home when it is on time', async () => {
        const lastPhoneHome = secondsAgo(12 * 60);
        answerSummaryWith(
            Promise.resolve(summaryResults({ ...identity, lastPhoneHome, interval: HOUR_SECONDS })),
        );

        renderDetails();

        expect(
            await screen.findByText(
                `Phoning home every ${formatDuration(HOUR_SECONDS)}. Last phone home ${formatTimeAgo(lastPhoneHome)}.`,
            ),
        ).toBeInTheDocument();
    });

    it('says the agent is late after two missed phone homes', async () => {
        const lastPhoneHome = secondsAgo(3 * HOUR_SECONDS);
        answerSummaryWith(
            Promise.resolve(summaryResults({ ...identity, lastPhoneHome, interval: HOUR_SECONDS })),
        );

        renderDetails();

        expect(
            await screen.findByText(
                `Late. Last phone home ${formatTimeAgo(lastPhoneHome)}, usually every ${formatDuration(HOUR_SECONDS)}.`,
            ),
        ).toBeInTheDocument();
    });

    it('says since when the agent is silent after ten missed phone homes', async () => {
        const lastPhoneHome = secondsAgo(2 * 24 * HOUR_SECONDS);
        answerSummaryWith(
            Promise.resolve(summaryResults({ ...identity, lastPhoneHome, interval: HOUR_SECONDS })),
        );

        renderDetails();

        expect(
            await screen.findByText(
                `Silent since ${formatTime(lastPhoneHome)}, ${formatTimeAgo(lastPhoneHome)}.`,
            ),
        ).toBeInTheDocument();
    });

    it('says only when the agent last phoned home when it phoned home once', async () => {
        const lastPhoneHome = secondsAgo(5 * 60);
        answerSummaryWith(Promise.resolve(summaryResults({ ...identity, lastPhoneHome })));

        renderDetails();

        expect(
            await screen.findByText(`Last phone home ${formatTimeAgo(lastPhoneHome)}.`),
        ).toBeInTheDocument();
    });

    it('says when the agent didn’t phone home in the last 7 days', async () => {
        answerSummaryWith(Promise.resolve(summaryResults(identity)));

        renderDetails();

        expect(await screen.findByText('No phone home in the last 7 days.')).toBeInTheDocument();
    });

    it('shows the time range, the counts, the charts, the apps and the activity', async () => {
        answerSummaryWith(Promise.resolve(summaryResults(identity)));

        renderDetails();

        expect(await screen.findByRole('button', { name: 'Last 24 hours' })).toBeVisible();
        ['Problems in this time range', 'Phone homes', 'Reconnects', 'Apps', 'Activity'].forEach(
            (name) => expect(screen.getByRole('heading', { level: 2, name })).toBeVisible(),
        );
    });

    it('tells when the indexes have no agent with this GUID', async () => {
        answerSummaryWith(Promise.resolve(summaryResults()));

        renderDetails();

        expect(await screen.findByText('No agent with this GUID')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: guid })).toBeVisible();
        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('searches everything the indexes keep about this agent', async () => {
        answerSummaryWith(Promise.resolve(summaryResults(identity)));

        renderDetails();
        await waitFor(() => expect(oneShot).toHaveBeenCalled());

        expect(oneShot).toHaveBeenCalledWith(
            expect.objectContaining({
                search: expect.stringContaining(`index=_dsclient data.clientId="${guid}"`),
                earliest_time: '0',
                latest_time: 'now',
            }),
            undefined,
            undefined,
            expect.anything(),
        );
    });

    it('runs the search again when you try again after it fails', async () => {
        silenceErrorBoundaryLogs();
        let attempts = 0;
        vi.mocked(oneShot).mockImplementation((params) => {
            if (!isSummarySearch(params)) {
                return new Promise(() => {});
            }
            attempts += 1;
            return attempts === 1
                ? Promise.reject(new Error('Search job quota exceeded'))
                : Promise.resolve(summaryResults(identity));
        });

        renderDetails();

        expect(await screen.findByText('Couldn’t load the agent')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByRole('heading', { level: 1, name: 'triss' })).toBeVisible();
    });
});

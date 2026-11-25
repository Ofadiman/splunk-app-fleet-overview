import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fn, restoreAllMocks } from '@vitest/spy';
import { afterEach, beforeEach, describe, expect, it } from '#component-tests';
import { DAY_SECONDS, HOUR_SECONDS, mockTimeParser } from '../../testing/mockTimeParser';
import { renderWithQueryClient } from '../../testing/renderWithQueryClient';
import TimeRangeControls from './TimeRangeControls';
import type { ChartTimeRange } from './TimeRangeControls.types';

const lastDay: ChartTimeRange = { earliest: '-24h@h', latest: 'now', resolution: '1h' };

const durations = {
    '-24h@h': DAY_SECONDS,
    '-7d@h': 7 * DAY_SECONDS,
    '-60m@m': HOUR_SECONDS,
};

const openResolutions = async () => {
    await userEvent.click(screen.getByRole('combobox', { name: /^Resolution/ }));
};

describe('TimeRangeControls', () => {
    beforeEach(() => {
        mockTimeParser(durations);
    });

    afterEach(() => {
        restoreAllMocks();
    });

    it('shows the time range and the resolution', () => {
        renderWithQueryClient(<TimeRangeControls value={lastDay} onChange={fn()} />);

        expect(screen.getByRole('button', { name: 'Last 24 hours' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Resolution: 1 hour' })).toBeVisible();
    });

    it('changes the resolution', async () => {
        const onChange = fn();
        renderWithQueryClient(<TimeRangeControls value={lastDay} onChange={onChange} />);

        await openResolutions();
        await userEvent.click(await screen.findByRole('option', { name: /^15 minutes/ }));

        expect(onChange).toHaveBeenCalledWith({ ...lastDay, resolution: '15m' });
    });

    it('describes the resolution that Auto picks for the time range', async () => {
        renderWithQueryClient(<TimeRangeControls value={lastDay} onChange={fn()} />);

        await openResolutions();

        await waitFor(() =>
            expect(
                screen.getByRole('option', { name: /^Auto.*15 minutes for this time range/ }),
            ).toBeVisible(),
        );
    });

    it('dims the resolutions that give too many points or too few', async () => {
        const lastWeek: ChartTimeRange = { earliest: '-7d@h', latest: 'now', resolution: '1h' };
        renderWithQueryClient(<TimeRangeControls value={lastWeek} onChange={fn()} />);

        await openResolutions();

        await waitFor(() =>
            expect(screen.getByRole('option', { name: /^1 minute/ })).toHaveAttribute(
                'aria-disabled',
                'true',
            ),
        );
        expect(screen.getByRole('option', { name: /^1 minute/ })).toHaveAccessibleName(
            /Too many points for this time range/,
        );
        expect(screen.getByRole('option', { name: /^1 week/ })).toHaveAccessibleName(
            /Too long for this time range/,
        );
        expect(screen.getByRole('option', { name: /^1 hour/ })).not.toHaveAttribute(
            'aria-disabled',
            'true',
        );
    });

    it('keeps the resolution when it fits the new time range', async () => {
        const onChange = fn();
        renderWithQueryClient(<TimeRangeControls value={lastDay} onChange={onChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Last 24 hours' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Last 7 days' }));

        await waitFor(() =>
            expect(onChange).toHaveBeenCalledWith({
                earliest: '-7d@h',
                latest: 'now',
                resolution: '1h',
            }),
        );
    });

    it('switches to Auto when the resolution gives too many points for the new time range', async () => {
        const onChange = fn();
        const everyMinute: ChartTimeRange = { ...lastDay, resolution: '1m' };
        renderWithQueryClient(<TimeRangeControls value={everyMinute} onChange={onChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Last 24 hours' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Last 7 days' }));

        await waitFor(() =>
            expect(onChange).toHaveBeenCalledWith({
                earliest: '-7d@h',
                latest: 'now',
                resolution: 'auto',
            }),
        );
    });

    it('offers no real-time ranges', async () => {
        renderWithQueryClient(<TimeRangeControls value={lastDay} onChange={fn()} />);

        await userEvent.click(screen.getByRole('button', { name: 'Last 24 hours' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeVisible(),
        );
        expect(screen.queryByRole('button', { name: '1 minute window' })).not.toBeInTheDocument();
    });
});

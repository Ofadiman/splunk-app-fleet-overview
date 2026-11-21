import { MARKER_MIN_SHARE } from './ConnectedForwardersChart.constants';
import type {
    ChartMarkers,
    ConnectedForwarders,
    MarkerColors,
    MarkerLabels,
    MinuteDeployments,
    MinuteReconnects,
} from './ConnectedForwardersChart.types';

const byMinute = (times: string[], values: string[]) =>
    new Map(times.map((time, index) => [time, Number(values[index] ?? 0)]));

const newFailuresByMinute = ({ times, failed }: MinuteDeployments) =>
    new Map(
        times.map((time, index) => [
            time,
            Math.max(0, Number(failed[index] ?? 0) - Number(failed[index - 1] ?? 0)),
        ]),
    );

export const buildMarkers = (
    connected: ConnectedForwarders,
    deployments: MinuteDeployments | undefined,
    reconnects: MinuteReconnects | undefined,
    labels: MarkerLabels,
    colors: MarkerColors,
): ChartMarkers => {
    const installed = byMinute(deployments?.times ?? [], deployments?.installed ?? []);
    const uninstalled = byMinute(deployments?.times ?? [], deployments?.uninstalled ?? []);
    const failed = byMinute(deployments?.times ?? [], deployments?.failed ?? []);
    const newFailures = deployments ? newFailuresByMinute(deployments) : new Map<string, number>();
    const reconnected = byMinute(reconnects?.times ?? [], reconnects?.counts ?? []);
    const markers: ChartMarkers = { times: [], labels: [], colors: [] };

    connected.times.forEach((time, index) => {
        const counts = {
            installed: installed.get(time) ?? 0,
            uninstalled: uninstalled.get(time) ?? 0,
            failed: failed.get(time) ?? 0,
            reconnects: reconnected.get(time) ?? 0,
        };
        const startedFailing = newFailures.get(time) ?? 0;
        const involved = counts.installed + counts.uninstalled + counts.reconnects + startedFailing;
        const threshold = Math.max(1, MARKER_MIN_SHARE * Number(connected.counts[index] ?? 0));

        if (involved < threshold) {
            return;
        }

        markers.times.push(time);
        markers.labels.push(
            (Object.keys(counts) as (keyof MarkerLabels)[])
                .filter((key) => counts[key] > 0)
                .map((key) => `${labels[key]}: ${counts[key]}`)
                .join(', '),
        );
        markers.colors.push(startedFailing > 0 ? colors.failure : colors.change);
    });

    return markers;
};

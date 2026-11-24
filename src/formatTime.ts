import { locale } from '@splunk/splunk-utils/config';

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

const relativeTimeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', DAY],
    ['hour', HOUR],
    ['minute', MINUTE],
    ['second', SECOND],
];

const largestUnit = (seconds: number) =>
    units.find(([, size]) => seconds >= 2 * size) ?? units[units.length - 1];

export const formatTime = (epochSeconds: number) => dateTimeFormat.format(epochSeconds * 1000);

export const formatTimeAgo = (epochSeconds: number, now = Date.now() / 1000) => {
    const elapsed = Math.max(0, now - epochSeconds);
    const [unit, size] = largestUnit(elapsed);
    return relativeTimeFormat.format(-Math.round(elapsed / size), unit);
};

export const formatDuration = (seconds: number) => {
    const [unit, size] = largestUnit(seconds);
    return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(
        Math.round(seconds / size),
    );
};

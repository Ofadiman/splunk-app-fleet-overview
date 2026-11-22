import type { SyntheticEvent } from 'react';
import Select from '@splunk/react-ui/Select';
import type { SelectChangeHandler } from '@splunk/react-ui/Select';
import TimeRangeDropdown from '@splunk/react-time-range/Dropdown';
import SplunkwebConnector from '@splunk/react-time-range/SplunkwebConnector';
import { sprintf } from '@splunk/ui-utils/format';
import { AUTO_RESOLUTION, SPANS } from './TimeRangeControls.constants';
import { useFetchTimeRangeDuration, useTimeRangeDuration } from './TimeRangeControls.hooks';
import { messages } from './TimeRangeControls.i18n';
import { StyledControls } from './TimeRangeControls.styles';
import type { TimeRange, TimeRangeControlsProps } from './TimeRangeControls.types';
import { autoSpan, isResolution, spanFit } from './TimeRangeControls.utils';

const TimeRangeControls = ({ value, onChange }: TimeRangeControlsProps) => {
    const duration = useTimeRangeDuration(value);
    const fetchDuration = useFetchTimeRangeDuration();

    const changeTimeRange = async (timeRange: TimeRange) => {
        const nextDuration = await fetchDuration(timeRange).catch(() => undefined);
        const keepsResolution =
            value.resolution === AUTO_RESOLUTION ||
            nextDuration === undefined ||
            spanFit(value.resolution, nextDuration) === 'fits';

        onChange({
            ...timeRange,
            resolution: keepsResolution ? value.resolution : AUTO_RESOLUTION,
        });
    };

    const handleTimeRangeChange = (_event: SyntheticEvent, data?: TimeRange) => {
        if (data) {
            void changeTimeRange({ earliest: data.earliest, latest: data.latest });
        }
    };

    const handleResolutionChange: SelectChangeHandler = (_event, { value: resolution }) => {
        if (isResolution(resolution)) {
            onChange({ ...value, resolution });
        }
    };

    return (
        <StyledControls>
            <SplunkwebConnector>
                <TimeRangeDropdown
                    earliest={value.earliest}
                    latest={value.latest}
                    onChange={handleTimeRangeChange}
                    realTimeDisabled
                />
            </SplunkwebConnector>
            <Select
                prefixLabel={messages.resolution}
                value={value.resolution}
                onChange={handleResolutionChange}
            >
                <Select.Option
                    label={messages.auto}
                    value={AUTO_RESOLUTION}
                    description={
                        duration === undefined
                            ? undefined
                            : sprintf(messages.autoDescription, messages.spans[autoSpan(duration)])
                    }
                />
                {SPANS.map((span) => {
                    const fit = duration === undefined ? 'fits' : spanFit(span, duration);
                    return (
                        <Select.Option
                            key={span}
                            label={messages.spans[span]}
                            value={span}
                            disabled={fit === 'fits' ? undefined : 'dimmed'}
                            description={fit === 'fits' ? undefined : messages[fit]}
                        />
                    );
                })}
            </Select>
        </StyledControls>
    );
};

export default TimeRangeControls;

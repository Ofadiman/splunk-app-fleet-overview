import styled from 'styled-components';
import { variables } from '@splunk/themes';
import { LOADING_HEIGHT } from './AgentDetails.constants';
import type { PhoneHomeStatus } from './AgentDetails.types';

const statusColors = {
    phoningHome: variables.contentColorPositive,
    late: variables.contentColorWarning,
    silent: variables.contentColorNegative,
    noInterval: variables.contentColorMuted,
    none: variables.contentColorMuted,
} satisfies Record<PhoneHomeStatus, unknown>;

export const StyledDetails = styled.div`
    display: flex;
    flex-direction: column;
    align-self: stretch;
    gap: ${variables.spacingMedium};
`;

export const StyledStatus = styled.p<{ $status: PhoneHomeStatus }>`
    display: flex;
    align-items: center;
    gap: ${variables.spacingSmall};
    margin: 0;

    svg {
        flex: none;
        color: ${({ $status }) => statusColors[$status]};
    }
`;

export const StyledSections = styled.div`
    display: grid;
    gap: ${variables.spacingLarge};
    margin-top: ${variables.spacingLarge};
`;

export const StyledLoading = styled.div`
    display: flex;
    align-items: center;
    gap: ${variables.spacingSmall};
    min-height: ${LOADING_HEIGHT}px;
`;

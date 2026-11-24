import styled from 'styled-components';
import { variables } from '@splunk/themes';
import { LOADING_HEIGHT } from './AgentAppsTable.constants';
import type { AppStatus } from './AgentAppsTable.types';

const statusColors = {
    failing: variables.contentColorNegative,
    installed: variables.contentColorPositive,
    uninstalled: variables.contentColorMuted,
    downloaded: variables.contentColorMuted,
} satisfies Record<AppStatus, unknown>;

export const StyledStatus = styled.span<{ $status: AppStatus }>`
    display: inline-flex;
    align-items: center;
    gap: ${variables.spacingXSmall};

    svg {
        flex: none;
        color: ${({ $status }) => statusColors[$status]};
    }
`;

export const StyledLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${variables.spacingSmall};
    height: ${LOADING_HEIGHT}px;
`;

import type { ReactElement } from 'react';
import {
    SplunkThemeProvider,
    unstable_splunk1cdThemeCustomizer as splunk1cdThemeCustomizer,
} from '@splunk/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mount } from 'cypress/react';
import { queryClientDefaultOptions } from '../../src/queryClient';

export const mountComponent = (component: ReactElement) =>
    mount(
        <SplunkThemeProvider
            family="prisma"
            colorScheme="light"
            density="comfortable"
            customizeTheme={splunk1cdThemeCustomizer}
        >
            <QueryClientProvider
                client={new QueryClient({ defaultOptions: queryClientDefaultOptions })}
            >
                {component}
            </QueryClientProvider>
        </SplunkThemeProvider>,
    );

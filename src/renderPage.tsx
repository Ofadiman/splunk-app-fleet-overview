import type { ReactElement } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';
import {
    SplunkThemeProvider,
    unstable_splunk1cdThemeCustomizer as splunk1cdThemeCustomizer,
} from '@splunk/themes';

export const renderPage = (page: ReactElement, pageTitle: string) => {
    getUserTheme()
        .then((theme) => {
            layout(
                <SplunkThemeProvider
                    family="prisma"
                    colorScheme={theme === 'dark' ? 'dark' : 'light'}
                    density="comfortable"
                    customizeTheme={splunk1cdThemeCustomizer}
                >
                    {page}
                </SplunkThemeProvider>,
                { pageTitle, theme, navLayout: 'auto', hideAppBar: true },
            );
        })
        .catch((error: unknown) => {
            const errorEl = document.createElement('span');
            errorEl.setAttribute('role', 'alert');
            errorEl.textContent = String(error);
            document.body.appendChild(errorEl);
        });
};

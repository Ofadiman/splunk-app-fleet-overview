import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';
import {
    SplunkThemeProvider,
    unstable_splunk1cdThemeCustomizer as splunk1cdThemeCustomizer,
} from '@splunk/themes';
import App from '../../App';

getUserTheme()
    .then((theme) => {
        layout(
            <SplunkThemeProvider
                family="prisma"
                colorScheme={theme === 'dark' ? 'dark' : 'light'}
                density="comfortable"
                customizeTheme={splunk1cdThemeCustomizer}
            >
                <App />
            </SplunkThemeProvider>,
            { pageTitle: 'Overview', theme, navLayout: 'auto' },
        );
    })
    .catch((error: unknown) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(error);
        document.body.appendChild(errorEl);
    });

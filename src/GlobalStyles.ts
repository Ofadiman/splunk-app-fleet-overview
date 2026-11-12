import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
    body {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
    }

    body > [role='main'] {
        flex-grow: 1;
    }
`;

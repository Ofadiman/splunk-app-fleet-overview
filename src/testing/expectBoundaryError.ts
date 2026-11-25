import { afterEach } from '#component-tests';
import { spyOn } from '@vitest/spy';

let expectedErrorListener: AbortController | undefined;
let restoreConsole: (() => void) | undefined;

export function expectBoundaryError(message: string) {
    expectedErrorListener?.abort();
    expectedErrorListener = new AbortController();

    restoreConsole?.();
    const consoleError = console.error;
    const errorSpy = spyOn(console, 'error').mockImplementation(
        (error: unknown, ...details: unknown[]) => {
            if (
                error instanceof Error &&
                error.message.replace(/^(?:Uncaught )?Error: /, '') === message
            ) {
                return;
            }
            consoleError.call(console, error, ...details);
        },
    );
    restoreConsole = () => errorSpy.mockRestore();

    window.addEventListener(
        'error',
        (event) => {
            if (event.error instanceof Error && event.error.message === message) {
                event.preventDefault();
            }
        },
        { capture: true, signal: expectedErrorListener.signal },
    );
}

afterEach(() => {
    expectedErrorListener?.abort();
    expectedErrorListener = undefined;
    restoreConsole?.();
    restoreConsole = undefined;
});

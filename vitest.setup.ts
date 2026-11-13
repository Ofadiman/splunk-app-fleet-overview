import '@testing-library/jest-dom';
import { vi } from 'vitest';

window.scrollTo = vi.fn<typeof window.scrollTo>();

window.matchMedia = vi.fn<typeof window.matchMedia>((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

import type { ComponentPropsWithoutRef } from 'react';

export type SplunkLinkProps = ComponentPropsWithoutRef<'a'> & {
    appearance?: 'inline' | 'standalone';
    disabled?: boolean;
    openInNewContext?: boolean | string;
};

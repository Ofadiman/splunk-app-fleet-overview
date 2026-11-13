import { forwardRef } from 'react';
import { createLink } from '@tanstack/react-router';
import Link from '@splunk/react-ui/Link';
import type { SplunkLinkProps } from './RouterLink.types';

const SplunkLink = forwardRef<HTMLAnchorElement, SplunkLinkProps>(({ href, ...props }, ref) => (
    <Link {...props} to={href} elementRef={ref} />
));

const RouterLink = createLink(SplunkLink);

export default RouterLink;

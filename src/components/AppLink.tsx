import Link, { type LinkProps } from '@mui/material/Link';
import { forwardRef } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router';

/** MUI typography + React Router navigation (client-side, keeps history). */
export const AppLink = forwardRef<
  HTMLAnchorElement,
  Omit<LinkProps, 'href'> & Pick<RouterLinkProps, 'to' | 'state' | 'replace'>
>(function AppLink(props, ref) {
  return <Link ref={ref} component={RouterLink} {...props} />;
});

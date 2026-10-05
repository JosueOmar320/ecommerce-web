import Box from '@mui/material/Box';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { MAIN_CONTENT_ID } from '@/components/SkipLink';
import { visuallyHidden } from '@/lib/a11y';

/**
 * Client-side navigation is silent for screen-reader users and leaves focus on the link that was
 * clicked (or on <body> when it disappeared). On every new page: move focus to the main content
 * and announce the page title. Pages that manage focus themselves (e.g. checkout step headings)
 * keep it: focus already inside <main> is left alone. Same-page URL changes (filters, steps,
 * pagination) do not count as a new page.
 */
export function RouteFocus() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState('');
  const isFirstPage = useRef(true);

  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    // After paint: the new page's <title> and content are in place.
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById(MAIN_CONTENT_ID);
      const active = document.activeElement;
      if (main && !(active && active !== document.body && main.contains(active))) {
        main.focus({ preventScroll: true });
      }
      setAnnouncement(document.title);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
      {announcement}
    </Box>
  );
}

import Box from '@mui/material/Box';
import { Outlet, ScrollRestoration } from 'react-router';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { Footer } from './Footer';
import { Header } from './Header';
import { NavigationProgress } from './NavigationProgress';

export function StoreLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SkipLink />
      <NavigationProgress />
      <Header />
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{ flex: 1, pt: { xs: 3, md: 5 }, outline: 'none' }}
      >
        <Outlet />
      </Box>
      <Footer />
      <ScrollRestoration />
    </Box>
  );
}

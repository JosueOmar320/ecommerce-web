import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { AppLink } from '@/components/AppLink';
import { PageContainer } from '@/components/PageContainer';
import { env } from '@/config/env';

export function Footer() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{ borderTop: 1, borderColor: 'divider', mt: { xs: 8, md: 12 }, py: { xs: 5, md: 7 } }}
    >
      <PageContainer>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {t('footer.about')}
            </Typography>
            <Typography color="textSecondary" sx={{ maxWidth: 420 }}>
              {t('footer.aboutText')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {t('footer.shop')}
            </Typography>
            <Stack spacing={1}>
              <AppLink to="/products" color="text.secondary">
                {t('nav.allProducts')}
              </AppLink>
              <AppLink to="/wishlist" color="text.secondary">
                {t('nav.wishlist')}
              </AppLink>
            </Stack>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {t('footer.help')}
            </Typography>
            <Stack spacing={1}>
              <AppLink to="/orders" color="text.secondary">
                {t('nav.orders')}
              </AppLink>
              <Link
                href={`${env.VITE_API_URL}/api/docs`}
                color="text.secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('footer.apiDocs')}
              </Link>
            </Stack>
          </Grid>
        </Grid>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 5 }}>
          {t('footer.rights', { year: new Date().getFullYear() })}
        </Typography>
      </PageContainer>
    </Box>
  );
}

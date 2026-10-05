import Category from '@mui/icons-material/CategoryOutlined';
import Dashboard from '@mui/icons-material/SpaceDashboardOutlined';
import Inventory from '@mui/icons-material/Inventory2Outlined';
import Menu from '@mui/icons-material/MenuOutlined';
import People from '@mui/icons-material/PeopleOutlined';
import Receipt from '@mui/icons-material/ReceiptLongOutlined';
import Storefront from '@mui/icons-material/StorefrontOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, Link as RouterLink } from 'react-router';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { ADMIN_SECTION_PERMISSION } from '@/features/auth/permissions';
import { useSession } from '@/features/auth/session';
import { AccountMenu } from './AccountMenu';
import { AppScrollRestoration } from './AppScrollRestoration';
import { NavigationProgress } from './NavigationProgress';
import { PreferencesMenu } from './PreferencesMenu';
import { RouteFocus } from './RouteFocus';

const SIDEBAR_WIDTH = 248;

/**
 * Same product, different working mode: a dense, dark sidebar distinguishes the back office from
 * the storefront in both colour schemes.
 */
export function AdminLayout() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = useSession();

  const sections: {
    to: string;
    label: string;
    icon: ReactNode;
    end?: boolean;
    visible: boolean;
  }[] = [
    {
      to: '/admin',
      label: t('admin.nav.dashboard'),
      icon: <Dashboard />,
      end: true,
      visible: true,
    },
    ...(
      [
        ['products', <Storefront key="products" />],
        ['categories', <Category key="categories" />],
        ['inventory', <Inventory key="inventory" />],
        ['orders', <Receipt key="orders" />],
        ['users', <People key="users" />],
      ] as const
    ).map(([section, icon]) => ({
      to: `/admin/${section}`,
      label: t(`admin.nav.${section}`),
      icon,
      visible: hasPermission(ADMIN_SECTION_PERMISSION[section]),
    })),
  ];
  // Only sections this account can open; the routes enforce the same rule.
  const items = sections.filter((item) => item.visible);

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#141716',
        color: '#e8ebe9',
      }}
    >
      <Box sx={{ px: 2.5, py: 2.25, display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography sx={{ fontWeight: 750, letterSpacing: '-0.04em', fontSize: '1.15rem' }}>
          {t('brand.name')}
        </Typography>
        <Typography variant="overline" sx={{ color: '#5cc6ab', lineHeight: 1 }}>
          {t('admin.title')}
        </Typography>
      </Box>
      <Box component="nav" aria-label={t('admin.navigation')} sx={{ flex: 1 }}>
        <List dense sx={{ px: 1 }}>
          {items.map((item) => (
            // <li> wrapper: a <ul> may only contain list items.
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.end}
                onClick={() => {
                  setOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.25,
                  color: '#c9cfcc',
                  '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 36 },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  '&.active': {
                    bgcolor: 'rgba(92,198,171,0.16)',
                    color: '#ffffff',
                    fontWeight: 650,
                  },
                  '&:focus-visible': { outline: '2px solid #5cc6ab', outlineOffset: -2 },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '0.9rem' } } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2 }}>
        <Button
          component={RouterLink}
          to="/"
          fullWidth
          variant="outlined"
          sx={{
            color: '#e8ebe9',
            borderColor: 'rgba(255,255,255,0.24)',
            '&:hover': { borderColor: '#ffffff' },
          }}
        >
          {t('admin.backToStore')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <SkipLink />
      <NavigationProgress />
      <Box component="aside" sx={{ width: { lg: SIDEBAR_WIDTH }, flexShrink: 0 }}>
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          sx={{ display: { lg: 'none' } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, border: 0 } } }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', lg: 'block' } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, border: 0 } } }}
        >
          {sidebar}
        </Drawer>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', gap: 1, px: { xs: 2, md: 4 } }}>
          <IconButton
            edge="start"
            aria-label={t('common.openMenu')}
            onClick={() => {
              setOpen(true);
            }}
            sx={{ display: { lg: 'none' } }}
          >
            <Menu />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <PreferencesMenu />
          <AccountMenu />
        </Toolbar>
        <Box
          component="main"
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          sx={{ flex: 1, p: { xs: 2, md: 4 }, outline: 'none' }}
        >
          <Outlet />
        </Box>
      </Box>
      <AppScrollRestoration />
      <RouteFocus />
    </Box>
  );
}

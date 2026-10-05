import Close from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesQuery } from '@/features/catalog/api';
import { NavLink, useNavigate } from 'react-router';
import { ADMIN_AREA_PERMISSIONS } from '@/features/auth/permissions';
import { useNotify } from '@/components/Notifications';
import { useSession } from '@/features/auth/session';
import { Logo } from './Logo';
import { PreferencesControls } from './PreferencesControls';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Full navigation on small screens: same destinations as desktop, adapted to touch. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, user, hasPermission, logout } = useSession();
  const notify = useNotify();
  const signedIn = status === 'authenticated';
  const categories = useQuery(categoriesQuery);
  const links: { to: string; label: string; end?: boolean }[] = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/products', label: t('nav.allProducts') },
    ...(categories.data ?? []).map((category) => ({
      to: `/categories/${category.slug}`,
      label: category.name,
    })),
    { to: '/wishlist', label: t('nav.wishlist') },
    { to: '/cart', label: t('nav.cart') },
    ...(signedIn
      ? [
          { to: '/orders', label: t('nav.orders') },
          { to: '/profile', label: t('nav.profile') },
          ...(ADMIN_AREA_PERMISSIONS.some((p) => hasPermission(p))
            ? [{ to: '/admin', label: t('nav.admin') }]
            : []),
        ]
      : []),
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 'min(88vw, 360px)' } } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}
      >
        <Logo />
        <IconButton aria-label={t('common.closeMenu')} onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      <Divider />
      <Box component="nav" aria-label={t('nav.mainNavigation')}>
        <List>
          {links.map((link) => (
            <ListItem key={link.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={link.to}
                end={link.end}
                onClick={onClose}
                sx={{ py: 1.25, '&.active': { fontWeight: 700, bgcolor: 'action.selected' } }}
              >
                <ListItemText
                  primary={link.label}
                  slotProps={{ primary: { sx: { fontWeight: 'inherit' } } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {signedIn ? (
            <ListItem disablePadding>
              <ListItemButton
                onClick={async () => {
                  onClose();
                  if (!(await logout())) {
                    notify({ message: t('auth.signOutOffline'), severity: 'error' });
                  }
                  void navigate('/');
                }}
                sx={{ py: 1.25 }}
              >
                <ListItemText primary={t('nav.signOut')} secondary={user?.email} />
              </ListItemButton>
            </ListItem>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/login" onClick={onClose} sx={{ py: 1.25 }}>
                  <ListItemText primary={t('nav.signIn')} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/register"
                  onClick={onClose}
                  sx={{ py: 1.25 }}
                >
                  <ListItemText primary={t('nav.signUp')} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <PreferencesControls />
      </Box>
    </Drawer>
  );
}

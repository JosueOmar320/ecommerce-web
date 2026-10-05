import Close from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { Logo } from './Logo';
import { PreferencesControls } from './PreferencesControls';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Full navigation on small screens: same destinations as desktop, adapted to touch. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/products', label: t('nav.allProducts') },
    { to: '/wishlist', label: t('nav.wishlist') },
    { to: '/cart', label: t('nav.cart') },
    { to: '/orders', label: t('nav.orders') },
    { to: '/profile', label: t('nav.profile') },
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
            <ListItemButton
              key={link.to}
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
          ))}
          <ListItemButton component={NavLink} to="/login" onClick={onClose} sx={{ py: 1.25 }}>
            <ListItemText primary={t('nav.signIn')} />
          </ListItemButton>
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <PreferencesControls />
      </Box>
    </Drawer>
  );
}

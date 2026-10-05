import Person from '@mui/icons-material/PersonOutlineOutlined';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router';
import { ADMIN_AREA_PERMISSIONS } from '@/features/auth/permissions';
import { useSession } from '@/features/auth/session';

/** Sign-in link for visitors; an accessible account menu (MUI Menu: arrow keys, Esc) for customers. */
export function AccountMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, user, hasPermission, logout } = useSession();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  if (status !== 'authenticated' || !user) {
    return (
      <Button
        component={RouterLink}
        to="/login"
        startIcon={<Person />}
        sx={{ color: 'text.primary' }}
      >
        {t('nav.signIn')}
      </Button>
    );
  }

  const close = () => {
    setAnchor(null);
  };
  const isAdmin = ADMIN_AREA_PERMISSIONS.some((permission) => hasPermission(permission));

  return (
    <>
      <Button
        startIcon={<Person />}
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        sx={{ color: 'text.primary', maxWidth: 180 }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.firstName}
        </span>
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, border: 1, borderColor: 'divider' } } }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} />
        </MenuItem>
        <Divider />
        <MenuItem component={RouterLink} to="/profile" onClick={close}>
          {t('nav.profile')}
        </MenuItem>
        <MenuItem component={RouterLink} to="/orders" onClick={close}>
          {t('nav.orders')}
        </MenuItem>
        <MenuItem component={RouterLink} to="/wishlist" onClick={close}>
          {t('nav.wishlist')}
        </MenuItem>
        {isAdmin && (
          <MenuItem component={RouterLink} to="/admin" onClick={close}>
            {t('nav.admin')}
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={async () => {
            close();
            await logout();
            void navigate('/');
          }}
        >
          {t('nav.signOut')}
        </MenuItem>
      </Menu>
    </>
  );
}

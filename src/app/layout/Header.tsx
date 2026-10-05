import Favorite from '@mui/icons-material/FavoriteBorderOutlined';
import Menu from '@mui/icons-material/MenuOutlined';
import Search from '@mui/icons-material/SearchOutlined';
import ShoppingBag from '@mui/icons-material/ShoppingBagOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link as RouterLink } from 'react-router';
import { categoriesQuery } from '@/features/catalog/api';
import { layout } from '@/theme/theme';
import { AccountMenu } from './AccountMenu';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { PreferencesMenu } from './PreferencesMenu';
import { SearchField } from './SearchField';

const navLinkSx = {
  color: 'text.primary',
  fontWeight: 550,
  px: 1.25,
  '&.active': { textDecoration: 'underline', textUnderlineOffset: 6, textDecorationThickness: 2 },
} as const;

export function Header() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const categories = useQuery(categoriesQuery);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar
        component="div"
        sx={{
          minHeight: { xs: layout.headerHeight },
          maxWidth: layout.maxWidth,
          width: '100%',
          mx: 'auto',
          px: layout.gutter,
          gap: { xs: 1, md: 3 },
        }}
      >
        <IconButton
          edge="start"
          aria-label={t('common.openMenu')}
          onClick={() => {
            setMobileOpen(true);
          }}
          sx={{ display: { md: 'none' } }}
        >
          <Menu />
        </IconButton>

        <Logo />

        <Box
          component="nav"
          aria-label={t('nav.mainNavigation')}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          <Button component={NavLink} to="/products" end sx={navLinkSx}>
            {t('nav.shop')}
          </Button>
          {categories.data?.map((category) => (
            <Button
              key={category.id}
              component={NavLink}
              to={`/categories/${category.slug}`}
              sx={navLinkSx}
            >
              {category.name}
            </Button>
          ))}
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, maxWidth: 440, ml: 'auto' }}>
          <SearchField />
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{ ml: { xs: 'auto', md: 0 }, alignItems: 'center' }}
        >
          <IconButton
            aria-label={t('search.label')}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
            }}
            sx={{ display: { md: 'none' } }}
          >
            <Search />
          </IconButton>
          <Tooltip title={t('nav.wishlist')}>
            <IconButton
              component={RouterLink}
              to="/wishlist"
              aria-label={t('nav.wishlist')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <Favorite />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('nav.cart')}>
            <IconButton component={RouterLink} to="/cart" aria-label={t('nav.cart')}>
              <ShoppingBag />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <PreferencesMenu />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <AccountMenu />
          </Box>
        </Stack>
      </Toolbar>

      <Collapse
        in={searchOpen}
        sx={{ display: { md: 'none' } }}
        unmountOnExit
        // Move focus into the field the user just asked to open.
        onEntered={() => mobileSearchRef.current?.focus()}
      >
        <Box sx={{ px: layout.gutter, pb: 1.5 }}>
          <SearchField
            inputRef={mobileSearchRef}
            onSubmitted={() => {
              setSearchOpen(false);
            }}
          />
        </Box>
      </Collapse>

      <MobileNav
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
        }}
      />
    </AppBar>
  );
}

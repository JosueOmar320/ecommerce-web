import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorderOutlined';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import type { ProductSummary } from '@/api/schema';
import { useNotify } from '@/components/Notifications';
import { useSession } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/errorMessage';
import { loginPath } from '@/lib/safeRedirect';
import { useToggleWishlist, wishlistQuery } from '../api';

interface WishlistButtonProps {
  product: ProductSummary;
  size?: IconButtonProps['size'];
  /** Solid background so the icon stays visible over product media. */
  overlay?: boolean;
}

/** Toggle with aria-pressed: screen readers hear "Save to wishlist, toggle button, pressed". */
export function WishlistButton({ product, size = 'medium', overlay = false }: WishlistButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const wishlist = useQuery({ ...wishlistQuery, enabled: signedIn });
  const toggle = useToggleWishlist();
  const saved = wishlist.data?.some((item) => item.productId === product.id) ?? false;
  const label = saved ? t('wishlist.remove') : t('wishlist.add');

  return (
    <Tooltip title={label} describeChild>
      <IconButton
        size={size}
        aria-label={t('wishlist.add')}
        aria-pressed={saved}
        onClick={() => {
          if (!signedIn) {
            void navigate(loginPath(location.pathname + location.search));
            return;
          }
          toggle.mutate(
            saved
              ? { productId: product.id, saved: true }
              : { productId: product.id, saved: false, product },
            {
              onSuccess: () => {
                notify(
                  saved
                    ? { message: t('wishlist.removed'), severity: 'info' }
                    : {
                        message: t('wishlist.added'),
                        action: { label: t('wishlist.viewWishlist'), to: '/wishlist' },
                      },
                );
              },
              onError: (error) => {
                notify({ message: getErrorMessage(error, t), severity: 'error' });
              },
            },
          );
        }}
        sx={{
          color: saved ? 'error.main' : 'text.primary',
          ...(overlay && {
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper' },
            boxShadow: 1,
          }),
        }}
      >
        {saved ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { env } from '@/config/env';

interface SeoProps {
  title?: string;
  description?: string;
  /** Set to false for pages that must not be indexed (account, checkout, admin). */
  index?: boolean;
  /** Canonical path; defaults to the current path without query string. */
  canonicalPath?: string;
}

/**
 * React 19 hoists <title>, <meta> and <link> rendered anywhere into <head>, so per-page metadata
 * needs no helmet library.
 */
export function Seo({ title, description, index = true, canonicalPath }: SeoProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const brand = t('brand.name');
  const fullTitle = title ? `${title} · ${brand}` : `${brand} · ${t('brand.tagline')}`;
  const canonical = `${env.VITE_SITE_URL}${canonicalPath ?? pathname}`;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {!index && <meta name="robots" content="noindex" />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      {description && <meta property="og:description" content={description} />}
    </>
  );
}

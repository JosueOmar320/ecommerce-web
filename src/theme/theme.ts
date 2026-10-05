import { alpha, createTheme, type ThemeOptions } from '@mui/material/styles';

/**
 * Kestrel design tokens. One accent colour, warm neutrals, near-square corners and a tight
 * type scale: an editorial look rather than a component-library template.
 * Colour pairs are chosen to meet WCAG 2.2 AA (4.5:1 for text, 3:1 for UI).
 */
const ink = '#151716';
const paper = '#faf9f7';
const accent = { light: '#0e5a4b', dark: '#5cc6ab' };

const fontFamily = '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Shared layout widths so pages align with the header and footer. */
export const layout = {
  maxWidth: 1320,
  gutter: { xs: 2, sm: 3, md: 4 },
  headerHeight: 64,
} as const;

const shared: ThemeOptions = {
  shape: { borderRadius: 4 },
  spacing: 8,
  typography: {
    fontFamily,
    htmlFontSize: 16,
    h1: {
      fontSize: 'clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem)',
      fontWeight: 650,
      letterSpacing: '-0.03em',
      lineHeight: 1.05,
    },
    h2: {
      fontSize: 'clamp(1.75rem, 1.4rem + 1.2vw, 2.4rem)',
      fontWeight: 650,
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
    },
    h3: { fontSize: '1.5rem', fontWeight: 620, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h4: { fontSize: '1.25rem', fontWeight: 620, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h5: { fontSize: '1.0625rem', fontWeight: 620, letterSpacing: '-0.01em' },
    h6: { fontSize: '0.9375rem', fontWeight: 620 },
    subtitle1: { fontSize: '1.0625rem', lineHeight: 1.55 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    overline: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  components: {
    // Gap instead of child margins: wrapped rows stay aligned (no stray offset on the new line).
    MuiStack: { defaultProps: { useFlexGap: true } },
    // MUI renders subtitles as <h6> by default, which invents headings in the outline.
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          h4: 'h4',
          h5: 'h5',
          h6: 'h6',
          subtitle1: 'p',
          subtitle2: 'p',
          body1: 'p',
          body2: 'p',
          inherit: 'p',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { minHeight: '100%' },
        // The storefront header is sticky: keep keyboard-focused and anchored elements out from
        // under it (WCAG 2.4.11 Focus Not Obscured).
        html: { scrollPaddingTop: layout.headerHeight + 16 },
        body: { WebkitFontSmoothing: 'antialiased', fontFeatureSettings: '"cv11", "ss01"' },
        // Visible, consistent keyboard focus everywhere (WCAG 2.4.7 / 2.4.13).
        ':focus-visible': {
          outline: '2px solid var(--mui-palette-primary-main)',
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 2, paddingInline: 18, minHeight: 40 },
        sizeLarge: { minHeight: 48 },
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { rounded: { borderRadius: 4 } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 2, fontWeight: 600 } } },
    MuiTooltip: { defaultProps: { arrow: false, enterDelay: 400 } },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
    MuiSkeleton: { defaultProps: { animation: 'wave' } },
  },
};

export const theme = createTheme({
  ...shared,
  cssVariables: { colorSchemeSelector: 'data-color-scheme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: accent.light, contrastText: '#ffffff' },
        secondary: { main: ink },
        background: { default: paper, paper: '#ffffff' },
        text: { primary: ink, secondary: '#55595a' },
        divider: alpha(ink, 0.12),
        success: { main: '#17723f' },
        warning: { main: '#8a5a00' },
        error: { main: '#b42318' },
        info: { main: '#1f5fa8' },
      },
    },
    dark: {
      palette: {
        primary: { main: accent.dark, contrastText: '#06231c' },
        secondary: { main: '#e8ebe9' },
        background: { default: '#101211', paper: '#171a19' },
        text: { primary: '#ecefed', secondary: '#a7adab' },
        divider: alpha('#ffffff', 0.12),
        success: { main: '#5fcf8f' },
        warning: { main: '#f0b94a' },
        error: { main: '#ff8a7a' },
        info: { main: '#7fb4f0' },
      },
    },
  },
});

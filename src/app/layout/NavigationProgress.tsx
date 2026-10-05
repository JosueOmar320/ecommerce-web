import LinearProgress from '@mui/material/LinearProgress';
import { useNavigation } from 'react-router';

/** Thin bar while a lazy route chunk loads, instead of blanking the page with a spinner. */
export function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;
  return (
    <LinearProgress
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        height: 2,
      }}
    />
  );
}

import Add from '@mui/icons-material/AddOutlined';
import Remove from '@mui/icons-material/RemoveOutlined';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Accessible name, e.g. "Quantity" or "Quantity for Nimbus X Phone". */
  label: string;
  size?: 'small' | 'medium';
}

/** Numeric input with −/+ buttons; clamps to [min, max] so impossible quantities cannot be entered. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled,
  label,
  size = 'medium',
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(min, max));
  const height = size === 'small' ? 36 : 44;

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        borderRadius: 0.5,
        height,
        width: 'fit-content',
      }}
    >
      <IconButton
        aria-label={t('product.decreaseQuantity')}
        size="small"
        disabled={disabled || value <= min}
        onClick={() => {
          onChange(clamp(value - 1));
        }}
      >
        <Remove fontSize="small" />
      </IconButton>
      <InputBase
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ''), 10);
          if (!Number.isNaN(parsed)) onChange(clamp(parsed));
        }}
        inputProps={{
          'aria-label': label,
          inputMode: 'numeric',
          role: 'spinbutton',
          'aria-valuemin': min,
          'aria-valuemax': max,
          'aria-valuenow': value,
          style: { textAlign: 'center' },
        }}
        sx={{ width: 44, fontWeight: 600 }}
      />
      <IconButton
        aria-label={t('product.increaseQuantity')}
        size="small"
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(clamp(value + 1));
        }}
      >
        <Add fontSize="small" />
      </IconButton>
    </Stack>
  );
}

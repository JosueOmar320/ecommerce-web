import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { useCancelOrder } from '../api';

interface CancelOrderDialogProps {
  order: Pick<Order, 'id' | 'orderNumber'>;
  open: boolean;
  onClose: () => void;
  /** After the closing transition; the trigger may be gone by then (the order was cancelled). */
  onExited?: () => void;
}

/** Same rule as the API: the reason is optional but, when given, 3–500 characters. */
export function CancelOrderDialog({ order, open, onClose, onExited }: CancelOrderDialogProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const cancel = useCancelOrder();
  const titleId = useId();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const invalid = trimmed.length > 0 && trimmed.length < 3;

  const close = () => {
    if (cancel.isPending) return;
    cancel.reset();
    setReason('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      slotProps={{ transition: { onExited } }}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (invalid) return;
          cancel.mutate(
            { id: order.id, reason: trimmed || undefined },
            {
              onSuccess: () => {
                notify({ message: t('orders.cancelled', { number: order.orderNumber }) });
                close();
              },
            },
          );
        }}
      >
        <DialogTitle id={titleId}>
          {t('orders.cancelTitle', { number: order.orderNumber })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t('orders.cancelBody')}</DialogContentText>
          {cancel.isError && <FormAlert>{getErrorMessage(cancel.error, t)}</FormAlert>}
          <TextField
            label={t('orders.cancelReason')}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
            multiline
            minRows={2}
            error={touched && invalid}
            helperText={
              touched && invalid ? t('orders.cancelReasonTooShort') : t('orders.cancelReasonHint')
            }
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={cancel.isPending}>
            {t('orders.keepOrder')}
          </Button>
          <Button type="submit" color="error" variant="contained" disabled={cancel.isPending}>
            {cancel.isPending ? t('orders.cancelling') : t('orders.cancel')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

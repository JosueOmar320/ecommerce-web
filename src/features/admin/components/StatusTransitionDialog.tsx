import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { useChangeOrderStatus } from '../api/orders';

interface StatusTransitionDialogProps {
  order: Pick<Order, 'id' | 'orderNumber'>;
  /** Null when closed; kept mounted so the success callback runs after the order changes. */
  target: OrderStatus | null;
  onClose: () => void;
}

export function StatusTransitionDialog({ order, target, onClose }: StatusTransitionDialogProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const titleId = useId();
  const change = useChangeOrderStatus();
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  // Keep the last target while the dialog fades out, so its title does not go blank.
  const [shown, setShown] = useState(target);
  if (target !== null && target !== shown) setShown(target);
  const trimmed = note.trim();
  const invalid = trimmed.length > 0 && trimmed.length < 3;
  const statusLabel = shown ? t(`orders.status.${shown}`) : '';
  const actionLabel = shown ? t(`admin.orders.transitions.${shown}`) : '';

  const close = () => {
    if (change.isPending) return;
    change.reset();
    setNote('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog
      open={target !== null}
      onClose={close}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (invalid || !target) return;
          change.mutate(
            { id: order.id, status: target, reason: trimmed || undefined },
            {
              onSuccess: () => {
                notify({
                  message: t('admin.orders.statusUpdated', {
                    number: order.orderNumber,
                    status: statusLabel,
                  }),
                });
                close();
              },
            },
          );
        }}
      >
        <DialogTitle id={titleId}>
          {t('admin.orders.transitionTitle', { number: order.orderNumber, action: actionLabel })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {target === 'CANCELLED'
              ? t('admin.orders.cancelBody')
              : t('admin.orders.transitionBody')}
          </DialogContentText>
          {change.isError && <FormAlert>{getErrorMessage(change.error, t)}</FormAlert>}
          <TextField
            label={t('admin.orders.note')}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
            multiline
            minRows={2}
            error={touched && invalid}
            helperText={
              touched && invalid ? t('orders.cancelReasonTooShort') : t('admin.orders.noteHint')
            }
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          {/* "Back", not "Cancel": next to "Cancel order" that would be ambiguous. */}
          <Button onClick={close} disabled={change.isPending}>
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={shown === 'CANCELLED' ? 'error' : 'primary'}
            disabled={change.isPending}
          >
            {change.isPending ? t('common.saving') : actionLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

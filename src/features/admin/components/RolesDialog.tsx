import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role, User } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { ROLES, useUpdateUser } from '../api/users';

interface RolesDialogProps {
  user: User;
  /** The signed-in admin editing themselves cannot drop their own ADMIN role (API rule). */
  isSelf: boolean;
  onClose: () => void;
}

export function RolesDialog({ user, isSelf, onClose }: RolesDialogProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const titleId = useId();
  const groupId = useId();
  const update = useUpdateUser();
  const [roles, setRoles] = useState<Role[]>(user.roles);
  const [touched, setTouched] = useState(false);
  const name = `${user.firstName} ${user.lastName}`;
  const invalid = roles.length === 0;

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="xs">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (invalid) return;
          update.mutate(
            { id: user.id, body: { roles } },
            {
              onSuccess: () => {
                notify({ message: t('admin.users.rolesSaved', { name }) });
                onClose();
              },
            },
          );
        }}
      >
        <DialogTitle id={titleId}>{t('admin.users.rolesTitle', { name })}</DialogTitle>
        <DialogContent>
          {update.isError && <FormAlert>{getErrorMessage(update.error, t)}</FormAlert>}
          <FormControl component="fieldset" error={touched && invalid} variant="standard">
            <FormLabel component="legend" id={groupId}>
              {t('admin.users.role')}
            </FormLabel>
            <FormGroup>
              {ROLES.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={roles.includes(role)}
                      disabled={isSelf && role === 'ADMIN'}
                      onChange={(event) => {
                        setRoles((current) =>
                          event.target.checked
                            ? [...current, role]
                            : current.filter((r) => r !== role),
                        );
                      }}
                    />
                  }
                  label={t(`admin.users.roles.${role}`)}
                />
              ))}
            </FormGroup>
            <FormHelperText>
              {touched && invalid ? t('admin.users.rolesRequired') : t('admin.users.rolesHint')}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={update.isPending}>
            {update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

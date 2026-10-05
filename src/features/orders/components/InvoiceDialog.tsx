import Print from '@mui/icons-material/PrintOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import GlobalStyles from '@mui/material/GlobalStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Invoice } from '@/api/schema';
import { OrderTotals } from '@/components/OrderTotals';
import { formatDate, formatMoney } from '@/lib/format';

interface InvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}

/**
 * The invoice as issued by the API. The API has no PDF endpoint, so "Print" uses the browser's
 * print dialog (which also offers "Save as PDF"); print styles hide everything but the invoice.
 */
export function InvoiceDialog({ invoice, open, onClose }: InvoiceDialogProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const money = (cents: number) => formatMoney(cents, invoice.currency, i18n.language);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="md"
      className="invoice-dialog"
    >
      {open && (
        <GlobalStyles
          styles={{
            '@media print': {
              'body > *:not(.invoice-dialog)': { display: 'none !important' },
              '.invoice-dialog .MuiDialog-container, .invoice-dialog .MuiPaper-root': {
                position: 'static',
                display: 'block',
                maxHeight: 'none',
                boxShadow: 'none',
                margin: 0,
                maxWidth: 'none',
              },
              '.invoice-dialog .MuiBackdrop-root, .invoice-dialog .MuiDialogActions-root': {
                display: 'none',
              },
            },
          }}
        />
      )}
      <DialogTitle id={titleId}>
        {t('orders.invoiceTitle', { number: invoice.invoiceNumber })}
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="overline" component="p" color="textSecondary">
              {t('orders.billedTo')}
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{invoice.billedTo.name}</Typography>
            <Typography color="textSecondary">{invoice.billedTo.email}</Typography>
          </Box>
          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Typography sx={{ fontWeight: 600 }}>{t('brand.name')}</Typography>
            <Typography color="textSecondary">
              {t('orders.issuedOn', { date: formatDate(invoice.issuedAt, i18n.language, 'long') })}
            </Typography>
            <Typography color="textSecondary">
              {t('orders.forOrder', { number: invoice.orderNumber })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('orders.product')}</TableCell>
                <TableCell align="right">{t('orders.quantity')}</TableCell>
                <TableCell align="right">{t('orders.unitPrice')}</TableCell>
                <TableCell align="right">{t('orders.lineTotal')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.productName}
                    <Typography variant="body2" color="textSecondary">
                      {item.variantName} · {t('orders.sku', { sku: item.sku })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{money(item.unitPriceCents)}</TableCell>
                  <TableCell align="right">{money(item.lineTotalCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ maxWidth: 320, ml: 'auto', mt: 2 }}>
          <OrderTotals {...invoice} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={() => {
            window.print();
          }}
        >
          {t('orders.print')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

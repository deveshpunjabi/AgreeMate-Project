import { formatDistanceToNow, format } from 'date-fns';

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return format(date, 'MMM d, yyyy');
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelative(dateString: string | Date | null | undefined): string {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return formatDistanceToNow(date, { addSuffix: true });
}

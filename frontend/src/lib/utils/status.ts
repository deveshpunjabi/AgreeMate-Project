export type AgreementStatus =
  | 'draft'
  | 'pending_borrower_acceptance'
  | 'pending_owner_confirmation'
  | 'active'
  | 'overdue'
  | 'return_initiated'
  | 'completed'
  | 'disputed'
  | 'rejected'
  | 'cancelled';

export const STATUS_CONFIG: Record<
  AgreementStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    label: string;
  }
> = {
  draft: {
    bg: 'bg-raised',
    text: 'text-ink',
    border: 'border-hairline',
    dot: 'bg-muted-soft',
    label: 'Draft',
  },
  pending_borrower_acceptance: {
    bg: 'bg-warning-subtle-alt',
    text: 'text-warning-strong',
    border: 'border-warning-border',
    dot: 'bg-warning',
    label: 'Pending Acceptance',
  },
  pending_owner_confirmation: {
    bg: 'bg-primary-subtle',
    text: 'text-primary-strong',
    border: 'border-primary-border',
    dot: 'bg-primary',
    label: 'Pending Confirmation',
  },
  active: {
    bg: 'bg-success-subtle',
    text: 'text-success-strong',
    border: 'border-success-border',
    dot: 'bg-success',
    label: 'Active',
  },
  overdue: {
    bg: 'bg-warning-subtle',
    text: 'text-warning-strong',
    border: 'border-warning-border',
    dot: 'bg-warning',
    label: 'Overdue',
  },
  return_initiated: {
    bg: 'bg-primary-subtle',
    text: 'text-primary-strong',
    border: 'border-primary-border',
    dot: 'bg-primary',
    label: 'Return Initiated',
  },
  completed: {
    bg: 'bg-success-subtle',
    text: 'text-success-strong',
    border: 'border-success-border',
    dot: 'bg-success',
    label: 'Completed',
  },
  disputed: {
    bg: 'bg-danger-subtle',
    text: 'text-danger-strong',
    border: 'border-danger-border',
    dot: 'bg-danger',
    label: 'Disputed',
  },
  rejected: {
    bg: 'bg-danger-subtle',
    text: 'text-danger-strong',
    border: 'border-danger-border',
    dot: 'bg-danger',
    label: 'Rejected',
  },
  cancelled: {
    bg: 'bg-raised',
    text: 'text-ink-muted',
    border: 'border-hairline',
    dot: 'bg-muted-soft',
    label: 'Cancelled',
  },
};

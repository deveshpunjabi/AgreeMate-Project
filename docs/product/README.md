# AgreeMate Product & Lending Lifecycle

## 7-Stage Agreement State Machine
```
draft ──► pending_borrower_acceptance ──► active ──► item_returned_pending_inspection ──► completed
   │                     │                   │
   ▼                     ▼                   ▼
cancelled             cancelled           disputed
```

## Key Rules
- **Terms Lock**: Terms are permanently locked once borrower signs.
- **Invitation Resend**: Lender can refresh the 7-day crypto invite token at any point during `pending_borrower_acceptance`.
- **Evidence Verification**: Photos are hashed (SHA-256) at handover and return.

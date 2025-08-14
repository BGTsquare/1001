export const PURCHASE_STATUS = {
  PENDING_INITIATION: 'pending_initiation',
  AWAITING_PAYMENT: 'awaiting_payment',
  PENDING_VERIFICATION: 'pending_verification',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS]

export const PURCHASE_STATUS_LABELS = {
  [PURCHASE_STATUS.PENDING_INITIATION]: '🟡 Pending - Waiting for payment initiation',
  [PURCHASE_STATUS.AWAITING_PAYMENT]: '🟠 Awaiting Payment - Please send payment and confirm',
  [PURCHASE_STATUS.PENDING_VERIFICATION]: '🔵 Under Review - We\'re verifying your payment',
  [PURCHASE_STATUS.COMPLETED]: '✅ Completed - Book delivered to your library',
  [PURCHASE_STATUS.REJECTED]: '❌ Rejected - Payment verification failed',
} as const
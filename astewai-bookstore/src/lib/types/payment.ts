/**
 * New Simplified Payment System Types
 */

export type PaymentStatus = 
  | 'pending' 
  | 'payment_initiated' 
  | 'payment_verified' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type WalletType = 'mobile_money' | 'bank_app' | 'crypto';

export type VerificationMethod = 'auto' | 'manual' | 'bank_statement' | 'sms_verification';

export type VerificationType = 
  | 'auto_match' 
  | 'ocr_processing' 
  | 'admin_verification' 
  | 'bank_statement_check' 
  | 'sms_verification';

export type AutoMatchingRuleType = 
  | 'amount_match' 
  | 'tx_id_pattern' 
  | 'time_window' 
  | 'user_history';

export interface WalletConfig {
  id: string;
  wallet_name: string;
  wallet_type: WalletType;
  deep_link_template: string;
  tx_id_pattern?: string;
  is_active: boolean;
  display_order: number;
  icon_url?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  item_type: 'book' | 'bundle';
  item_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  
  // Wallet integration
  selected_wallet_id?: string;
  deep_link_clicked_at?: string;
  
  // Manual payment
  manual_tx_id?: string;
  manual_amount?: number;
  receipt_uploaded_at?: string;
  receipt_urls?: string[];
  
  // OCR processing
  ocr_processed_at?: string;
  ocr_extracted_tx_id?: string;
  ocr_extracted_amount?: number;
  ocr_confidence_score?: number;
  ocr_raw_text?: string;
  
  // Auto-matching
  auto_matched_at?: string;
  auto_match_confidence?: number;
  auto_match_reason?: string;
  
  // Admin verification
  admin_verified_at?: string;
  admin_verified_by?: string;
  admin_notes?: string;
  verification_method?: VerificationMethod;
  
  // Metadata
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentVerificationLog {
  id: string;
  payment_request_id: string;
  verification_type: VerificationType;
  status: 'success' | 'failed' | 'pending';
  details?: Record<string, any>;
  error_message?: string;
  processed_by?: string;
  created_at: string;
}

export interface AutoMatchingRule {
  id: string;
  rule_name: string;
  rule_type: AutoMatchingRuleType;
  conditions: Record<string, any>;
  confidence_threshold: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequestData {
  item_type: 'book' | 'bundle';
  item_id: string;
  amount: number;
  currency?: string;
  selected_wallet_id?: string;
}

export interface UpdatePaymentRequestData {
  status?: PaymentStatus;
  selected_wallet_id?: string;
  deep_link_clicked_at?: string;
  manual_tx_id?: string;
  manual_amount?: number;
  receipt_urls?: string[];
  ocr_extracted_tx_id?: string;
  ocr_extracted_amount?: number;
  ocr_confidence_score?: number;
  ocr_raw_text?: string;
  auto_matched_at?: string;
  auto_match_confidence?: number;
  auto_match_reason?: string;
  admin_verified_at?: string;
  admin_verified_by?: string;
  admin_notes?: string;
  verification_method?: VerificationMethod;
}

export interface OCRResult {
  extracted_tx_id?: string;
  extracted_amount?: number;
  confidence_score: number;
  raw_text: string;
  processing_time_ms: number;
}

export interface AutoMatchResult {
  matched: boolean;
  confidence: number;
  rule_id?: string;
  reason?: string;
}

export interface PaymentRequestWithDetails extends PaymentRequest {
  // Related data
  wallet_config?: WalletConfig;
  item_title?: string;
  user_email?: string;
  user_name?: string;
  verification_logs?: PaymentVerificationLog[];
}

export interface PaymentStats {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  failed_requests: number;
  auto_matched_requests: number;
  manual_verified_requests: number;
  total_amount: number;
  average_processing_time_hours: number;
}

export interface PaymentFilters {
  status?: PaymentStatus[];
  wallet_type?: WalletType[];
  date_range?: [Date, Date];
  amount_range?: [number, number];
  verification_method?: VerificationMethod[];
  auto_matched?: boolean;
  search_query?: string;
}

export interface PaymentSortOptions {
  sort_by: 'created_at' | 'amount' | 'status' | 'auto_match_confidence';
  sort_order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaymentListResponse {
  data: PaymentRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaymentRequestResponse extends ApiResponse<PaymentRequestWithDetails> {}

export interface PaymentListResponse extends ApiResponse<PaymentListResponse> {}

export interface WalletConfigResponse extends ApiResponse<WalletConfig[]> {}

export interface OCRProcessingResponse extends ApiResponse<OCRResult> {}

export interface AutoMatchResponse extends ApiResponse<AutoMatchResult> {}

export interface PaymentStatsResponse extends ApiResponse<PaymentStats> {}

// Form types
export interface PaymentFormData {
  selected_wallet_id: string;
  manual_tx_id?: string;
  manual_amount?: number;
  receipt_files?: File[];
}

export interface AdminVerificationFormData {
  verification_method: VerificationMethod;
  admin_notes?: string;
  approve: boolean;
}

// Hook types
export interface UsePaymentRequestsOptions {
  filters?: PaymentFilters;
  sort?: PaymentSortOptions;
  pagination?: PaginationOptions;
  enabled?: boolean;
}

export interface UsePaymentRequestOptions {
  id: string;
  enabled?: boolean;
}

export interface UseWalletConfigsOptions {
  active_only?: boolean;
  wallet_type?: WalletType;
}

// Component props
export interface PaymentButtonProps {
  item: {
    id: string;
    title: string;
    price: number;
  };
  itemType: 'book' | 'bundle';
  className?: string;
  onPaymentInitiated?: (paymentRequest: PaymentRequest) => void;
  onPaymentCompleted?: (paymentRequest: PaymentRequest) => void;
}

export interface WalletSelectorProps {
  wallets: WalletConfig[];
  selectedWalletId?: string;
  onWalletSelect: (walletId: string) => void;
  className?: string;
}

export interface PaymentConfirmationProps {
  paymentRequest: PaymentRequest;
  onTxIdSubmit: (txId: string, amount?: number) => void;
  onReceiptUpload: (files: File[]) => void;
  className?: string;
}

export interface AdminPaymentDashboardProps {
  filters?: PaymentFilters;
  onFiltersChange?: (filters: PaymentFilters) => void;
  className?: string;
}

export interface PaymentVerificationProps {
  paymentRequest: PaymentRequest;
  onVerify: (data: AdminVerificationFormData) => void;
  onReject: (reason: string) => void;
  className?: string;
}



import type { PurchaseRequest as BasePurchaseRequest } from './index';

export type PurchaseRequestStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed';

export interface PurchaseRequestWithRelations extends BasePurchaseRequest {
  book?: {
    id: string;
    title: string;
    author?: string;
    cover_image_url?: string;
  };
  bundle?: {
    id: string;
    title: string;
    cover_image_url?: string;
  };
}

export interface PurchaseRequestCardData {
  id: string;
  itemName: string;
  itemType: 'Book' | 'Bundle';
  amount: number;
  status: PurchaseRequestStatus;
  created_at: string;
  admin_notes?: string;
  preferred_contact_method?: string;
}

export interface PurchaseRequestDetailsData extends PurchaseRequestCardData {
  coverImageUrl?: string;
  author?: string;
  user_message?: string;
  contacted_at?: string;
  responded_at?: string;
}
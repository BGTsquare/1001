import type { PurchaseRequest, AdminContactInfo } from '@/types';

export function getItemName(request: PurchaseRequest): string {
  return request.book?.title || request.bundle?.title || 'Unknown Item';
}

export function getItemType(request: PurchaseRequest): 'Book' | 'Bundle' {
  return request.item_type === 'book' ? 'Book' : 'Bundle';
}

export function getCoverImageUrl(request: PurchaseRequest): string | undefined {
  return request.book?.cover_image_url || request.bundle?.cover_image_url;
}

export function getPreferredContact(
  request: PurchaseRequest, 
  contacts: AdminContactInfo[]
): AdminContactInfo | undefined {
  if (request.preferred_contact_method) {
    return contacts.find(c => 
      c.contact_type === request.preferred_contact_method && c.is_primary
    );
  }
  return contacts.find(c => c.is_primary);
}

export function hasAuthor(request: PurchaseRequest): boolean {
  return 'author' in (request.book || {}) && Boolean(request.book?.author);
}

export function getAuthor(request: PurchaseRequest): string | undefined {
  return hasAuthor(request) ? request.book?.author : undefined;
}
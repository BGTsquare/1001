export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          full_name: string | null
          is_admin: boolean
        }
        Insert: {
          user_id: string
          full_name?: string | null
          is_admin?: boolean
        }
        Update: {
          user_id?: string
          full_name?: string | null
          is_admin?: boolean
        }
      }
      manual_payment_submissions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          payment_request_id: string
          amount: number
          receipt_urls: string[] | null
          storage_paths: string[] | null
          status: 'pending' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          payment_request_id: string
          amount: number
          receipt_urls?: string[] | null
          storage_paths?: string[] | null
          status?: 'pending' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          payment_request_id?: string
          amount?: number
          receipt_urls?: string[] | null
          storage_paths?: string[] | null
          status?: 'pending' | 'approved' | 'rejected'
        }
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          item_id: string
          amount: number
          currency: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          item_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      user_library: {
        Row: {
          user_id: string
          book_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          book_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          book_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

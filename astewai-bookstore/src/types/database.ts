export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          reading_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          reading_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          reading_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          description: string | null
          cover_image_url: string | null
          content_url: string | null
          price: number
          is_free: boolean
          category: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          description?: string | null
          cover_image_url?: string | null
          content_url?: string | null
          price?: number
          is_free?: boolean
          category?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          description?: string | null
          cover_image_url?: string | null
          content_url?: string | null
          price?: number
          is_free?: boolean
          category?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundles: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle_books: {
        Row: {
          bundle_id: string
          book_id: string
        }
        Insert: {
          bundle_id: string
          book_id: string
        }
        Update: {
          bundle_id?: string
          book_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_books_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      user_library: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: 'owned' | 'pending' | 'completed'
          progress: number
          last_read_position: string | null
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status?: 'owned' | 'pending' | 'completed'
          progress?: number
          last_read_position?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          status?: 'owned' | 'pending' | 'completed'
          progress?: number
          last_read_position?: string | null
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string | null
          author_id: string | null
          category: string | null
          tags: string[] | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt?: string | null
          author_id?: string | null
          category?: string | null
          tags?: string[] | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string | null
          author_id?: string | null
          category?: string | null
          tags?: string[] | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          item_type: 'book' | 'bundle'
          item_id: string
          amount: number
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_provider_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'book' | 'bundle'
          item_id: string
          amount: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_provider_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'book' | 'bundle'
          item_id?: string
          amount?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_provider_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          book_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_contact_info: {
        Row: {
          id: string
          admin_id: string
          contact_type: 'telegram' | 'whatsapp' | 'email'
          contact_value: string
          display_name: string | null
          is_active: boolean
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          contact_type: 'telegram' | 'whatsapp' | 'email'
          contact_value: string
          display_name?: string | null
          is_active?: boolean
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          contact_type?: 'telegram' | 'whatsapp' | 'email'
          contact_value?: string
          display_name?: string | null
          is_active?: boolean
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_contact_info_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_requests: {
        Row: {
          id: string
          user_id: string
          item_type: 'book' | 'bundle'
          item_id: string
          amount: number
          status: 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed'
          preferred_contact_method: 'telegram' | 'whatsapp' | 'email' | null
          user_message: string | null
          admin_notes: string | null
          contacted_at: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'book' | 'bundle'
          item_id: string
          amount: number
          status?: 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed'
          preferred_contact_method?: 'telegram' | 'whatsapp' | 'email' | null
          user_message?: string | null
          admin_notes?: string | null
          contacted_at?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'book' | 'bundle'
          item_id?: string
          amount?: number
          status?: 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed'
          preferred_contact_method?: 'telegram' | 'whatsapp' | 'email' | null
          user_message?: string | null
          admin_notes?: string | null
          contacted_at?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
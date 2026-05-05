export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'renter' | 'host' | 'admin'
export type ListingStatus = 'pending' | 'active' | 'expired' | 'rejected'
export type ReportReason = 'Scam' | 'Fake listing' | 'Wrong information' | 'Inappropriate content'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone: string | null
          full_name: string
          avatar_url: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          full_name: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          host_id: string
          title: string
          type: string
          wilaya: string
          price: number
          area: number
          bedrooms: number
          bathrooms: number
          description: string | null
          status: ListingStatus
          latitude: number | null
          longitude: number | null
          views: number
          contact_clicks: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          type: string
          wilaya: string
          price: number
          area: number
          bedrooms: number
          bathrooms: number
          description?: string | null
          status?: ListingStatus
          latitude?: number | null
          longitude?: number | null
          views?: number
          contact_clicks?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          type?: string
          wilaya?: string
          price?: number
          area?: number
          bedrooms?: number
          bathrooms?: number
          description?: string | null
          status?: ListingStatus
          latitude?: number | null
          longitude?: number | null
          views?: number
          contact_clicks?: number
          created_at?: string
          expires_at?: string
        }
      }
      listing_images: {
        Row: {
          id: string
          listing_id: string
          url: string
          display_order: number
        }
        Insert: {
          id?: string
          listing_id: string
          url: string
          display_order?: number
        }
        Update: {
          id?: string
          listing_id?: string
          url?: string
          display_order?: number
        }
      }
      listing_amenities: {
        Row: {
          id: string
          listing_id: string
          amenity: string
        }
        Insert: {
          id?: string
          listing_id: string
          amenity: string
        }
        Update: {
          id?: string
          listing_id?: string
          amenity?: string
        }
      }
      listing_tags: {
        Row: {
          id: string
          listing_id: string
          tag: string
        }
        Insert: {
          id?: string
          listing_id: string
          tag: string
        }
        Update: {
          id?: string
          listing_id?: string
          tag?: string
        }
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          author_id: string
          stars: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          author_id: string
          stars: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          author_id?: string
          stars?: number
          comment?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          listing_id: string
          reporter_id: string
          reason: ReportReason
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reporter_id: string
          reason: ReportReason
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          reporter_id?: string
          reason?: ReportReason
          description?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_listing_views: {
        Args: {
          listing_id: string
        }
        Returns: void
      }
      increment_listing_contact_clicks: {
        Args: {
          listing_id: string
        }
        Returns: void
      }
    }
    Enums: {
      user_role: UserRole
      listing_status: ListingStatus
      report_reason: ReportReason
    }
  }
}

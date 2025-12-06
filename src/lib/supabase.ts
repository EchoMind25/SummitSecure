import { createClient } from '@supabase/supabase-js'

// Create Supabase client only if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null
}

// Get the current site URL (client-side or server-side)
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return siteUrl
}

// Database types (generated from our schema)
export type Database = {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          firm_id: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          firm_id?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          firm_id?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      branding_settings: {
        Row: {
          id: string
          firm_id: string
          logo_url: string | null
          primary_color: string
          require_client_password: boolean
          show_powered_by: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          logo_url?: string | null
          primary_color?: string
          require_client_password?: boolean
          show_powered_by?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          logo_url?: string | null
          primary_color?: string
          require_client_password?: boolean
          show_powered_by?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          firm_id: string
          name: string
          email: string | null
          share_id: string
          password_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          name: string
          email?: string | null
          share_id: string
          password_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          name?: string
          email?: string | null
          share_id?: string
          password_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          client_id: string
          firm_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          storage_path: string
          uploaded_by: string | null
          is_locked: boolean
          unlocked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          firm_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          storage_path: string
          uploaded_by?: string | null
          is_locked?: boolean
          unlocked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          firm_id?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          uploaded_by?: string | null
          is_locked?: boolean
          unlocked_at?: string | null
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          firm_id: string
          user_id: string | null
          client_id: string | null
          action: string
          resource_type: string
          resource_id: string
          ip_address: string | null
          user_agent: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          user_id?: string | null
          client_id?: string | null
          action: string
          resource_type: string
          resource_id: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          user_id?: string | null
          client_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id: string
          p_client_id?: string
          p_metadata?: Record<string, any>
        }
        Returns: undefined
      }
      unlock_client_files: {
        Args: {
          p_client_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

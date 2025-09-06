import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          timestamp: number
          output: string
          raw_input: string
          analysis: any
          threat_level: string | null
          location: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          timestamp: number
          output: string
          raw_input: string
          analysis: any
          threat_level?: string | null
          location?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          timestamp?: number
          output?: string
          raw_input?: string
          analysis?: any
          threat_level?: string | null
          location?: string | null
        }
      }
      user_configurations: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          action_mapping: any
          location_codes: any
          target_mapping: any
          militant_groups: any
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          action_mapping?: any
          location_codes?: any
          target_mapping?: any
          militant_groups?: any
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          action_mapping?: any
          location_codes?: any
          target_mapping?: any
          militant_groups?: any
        }
      }
    }
  }
}
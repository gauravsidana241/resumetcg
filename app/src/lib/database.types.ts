// Generated from the Supabase schema (helper generics trimmed). Regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      cards: {
        Row: { active: boolean; base_id: string | null; id: string; rarity: string; set_id: string; stack: string }
        Insert: { active?: boolean; base_id?: string | null; id: string; rarity: string; set_id?: string; stack: string }
        Update: { active?: boolean; base_id?: string | null; id?: string; rarity?: string; set_id?: string; stack?: string }
        Relationships: []
      }
      pack_opens: {
        Row: { id: number; opened_at: string; pack_count: number; user_id: string }
        Insert: { id?: never; opened_at?: string; pack_count: number; user_id?: string }
        Update: { id?: never; opened_at?: string; pack_count?: number; user_id?: string }
        Relationships: []
      }
      progress: {
        Row: {
          box: number
          card_id: string
          due_at: string
          lapses: number
          last_reviewed_at: string | null
          reviews: number
          user_id: string
        }
        Insert: {
          box?: number
          card_id: string
          due_at?: string
          lapses?: number
          last_reviewed_at?: string | null
          reviews?: number
          user_id?: string
        }
        Update: {
          box?: number
          card_id?: string
          due_at?: string
          lapses?: number
          last_reviewed_at?: string | null
          reviews?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'progress_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          },
        ]
      }
      special_pulls: {
        Row: { card_id: string; color: string; id: number; kind: string; pulled_at: string; user_id: string }
        Insert: { card_id: string; color: string; id?: never; kind: string; pulled_at?: string; user_id?: string }
        Update: { card_id?: string; color?: string; id?: never; kind?: string; pulled_at?: string; user_id?: string }
        Relationships: []
      }
      reviews: {
        Row: {
          box_after: number
          box_before: number | null
          card_id: string
          got_it: boolean
          id: number
          reviewed_at: string
          user_id: string
          xp: number
        }
        Insert: {
          box_after: number
          box_before?: number | null
          card_id: string
          got_it: boolean
          id?: never
          reviewed_at?: string
          user_id?: string
          xp?: number
        }
        Update: {
          box_after?: number
          box_before?: number | null
          card_id?: string
          got_it?: boolean
          id?: never
          reviewed_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_home: { Args: { p_tz?: string }; Returns: Json }
      open_packs: {
        Args: { p_packs: number; p_set?: string; p_tz?: string }
        Returns: {
          card_box: number
          card_key: string
          pack_no: number
          slot_kind: string
          slot_no: number
          special_color: string | null
          special_kind: string | null
        }[]
      }
      record_answer: { Args: { p_card_id: string; p_got_it: boolean; p_tz?: string }; Returns: Json }
      review_interval: { Args: { p_box: number; p_rarity: string }; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

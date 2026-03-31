export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ball_pool_bets: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payout: number | null
          round_id: string
          selected_ball: number
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payout?: number | null
          round_id: string
          selected_ball: number
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payout?: number | null
          round_id?: string
          selected_ball?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ball_pool_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "ball_pool_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ball_pool_rounds: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          multiplier: number | null
          round_number: number
          starts_at: string | null
          status: string | null
          winning_ball: number | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          multiplier?: number | null
          round_number?: number
          starts_at?: string | null
          status?: string | null
          winning_ball?: number | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          multiplier?: number | null
          round_number?: number
          starts_at?: string | null
          status?: string | null
          winning_ball?: number | null
        }
        Relationships: []
      }
      color_trading_bets: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payout: number | null
          predicted_color: string
          round_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payout?: number | null
          predicted_color: string
          round_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payout?: number | null
          predicted_color?: string
          round_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_trading_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "color_trading_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      color_trading_rounds: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          result_color: string | null
          round_number: number
          starts_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          result_color?: string | null
          round_number?: number
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          result_color?: string | null
          round_number?: number
          starts_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cricket_matches: {
        Row: {
          created_at: string | null
          id: string
          man_of_match: string | null
          match_date: string
          match_type: string | null
          players_team_a: Json | null
          players_team_b: Json | null
          result_set_at: string | null
          result_set_by: string | null
          status: string | null
          team_a: string
          team_b: string
          updated_at: string | null
          venue: string | null
          winner_team: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          man_of_match?: string | null
          match_date: string
          match_type?: string | null
          players_team_a?: Json | null
          players_team_b?: Json | null
          result_set_at?: string | null
          result_set_by?: string | null
          status?: string | null
          team_a: string
          team_b: string
          updated_at?: string | null
          venue?: string | null
          winner_team?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          man_of_match?: string | null
          match_date?: string
          match_type?: string | null
          players_team_a?: Json | null
          players_team_b?: Json | null
          result_set_at?: string | null
          result_set_by?: string | null
          status?: string | null
          team_a?: string
          team_b?: string
          updated_at?: string | null
          venue?: string | null
          winner_team?: string | null
        }
        Relationships: []
      }
      fantasy_contests: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_participants: number
          entry_fee: number
          id: string
          match_id: string
          max_participants: number
          prize_distribution: Json | null
          prize_pool: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          entry_fee?: number
          id?: string
          match_id: string
          max_participants?: number
          prize_distribution?: Json | null
          prize_pool?: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          entry_fee?: number
          id?: string
          match_id?: string
          max_participants?: number
          prize_distribution?: Json | null
          prize_pool?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_contests_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "cricket_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_players: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_playing: boolean
          match_id: string
          player_name: string
          points: number
          role: string
          team: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          is_playing?: boolean
          match_id: string
          player_name: string
          points?: number
          role?: string
          team: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_playing?: boolean
          match_id?: string
          player_name?: string
          points?: number
          role?: string
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "cricket_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_teams: {
        Row: {
          captain: string | null
          contest_id: string
          created_at: string | null
          id: string
          payout: number | null
          players: Json
          rank: number | null
          team_name: string
          total_points: number
          user_id: string
          vice_captain: string | null
        }
        Insert: {
          captain?: string | null
          contest_id: string
          created_at?: string | null
          id?: string
          payout?: number | null
          players?: Json
          rank?: number | null
          team_name?: string
          total_points?: number
          user_id: string
          vice_captain?: string | null
        }
        Update: {
          captain?: string | null
          contest_id?: string
          created_at?: string | null
          id?: string
          payout?: number | null
          players?: Json
          rank?: number | null
          team_name?: string
          total_points?: number
          user_id?: string
          vice_captain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_teams_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "fantasy_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: string | null
          id: string
          severity: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      game_configs: {
        Row: {
          commission_percent: number | null
          created_at: string | null
          description: string | null
          game_type: string
          id: string
          is_active: boolean | null
          max_bet: number | null
          min_bet: number | null
          settings: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          game_type: string
          id?: string
          is_active?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          settings?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          commission_percent?: number | null
          created_at?: string | null
          description?: string | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          settings?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ipl_predictions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payout: number | null
          prediction_type: string
          prediction_value: string
          season: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payout?: number | null
          prediction_type: string
          prediction_value: string
          season?: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payout?: number | null
          prediction_type?: string
          prediction_value?: string
          season?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          document_back_url: string | null
          document_front_url: string | null
          document_number: string | null
          document_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_predictions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          match_id: string
          payout: number | null
          prediction_type: string
          prediction_value: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          match_id: string
          payout?: number | null
          prediction_type: string
          prediction_value: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          match_id?: string
          payout?: number | null
          prediction_type?: string
          prediction_value?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "cricket_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          kyc_status: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rummy_players: {
        Row: {
          hand: Json | null
          id: string
          joined_at: string | null
          score: number | null
          status: string | null
          table_id: string
          user_id: string
        }
        Insert: {
          hand?: Json | null
          id?: string
          joined_at?: string | null
          score?: number | null
          status?: string | null
          table_id: string
          user_id: string
        }
        Update: {
          hand?: Json | null
          id?: string
          joined_at?: string | null
          score?: number | null
          status?: string | null
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rummy_players_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "rummy_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      rummy_tables: {
        Row: {
          created_at: string | null
          current_players: number | null
          entry_fee: number
          game_data: Json | null
          id: string
          is_private: boolean | null
          max_players: number | null
          name: string
          prize_pool: number | null
          status: string | null
          table_code: string | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_players?: number | null
          entry_fee: number
          game_data?: Json | null
          id?: string
          is_private?: boolean | null
          max_players?: number | null
          name: string
          prize_pool?: number | null
          status?: string | null
          table_code?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_players?: number | null
          entry_fee?: number
          game_data?: Json | null
          id?: string
          is_private?: boolean | null
          max_players?: number | null
          name?: string
          prize_pool?: number | null
          status?: string | null
          table_code?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          bonus_balance: number | null
          created_at: string | null
          id: string
          total_deposited: number | null
          total_winnings: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          bonus_balance?: number | null
          created_at?: string | null
          id?: string
          total_deposited?: number | null
          total_winnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          bonus_balance?: number | null
          created_at?: string | null
          id?: string
          total_deposited?: number | null
          total_winnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

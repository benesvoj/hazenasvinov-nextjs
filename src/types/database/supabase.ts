export type Json = string | number | boolean | null | {[key: string]: Json | undefined} | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      betting_bet_legs: {
        Row: {
          away_team: string | null;
          bet_id: string;
          bet_type: string;
          created_at: string;
          home_team: string | null;
          id: string;
          match_date: string | null;
          match_id: string;
          odds: number;
          parameter: Json | null;
          result_determined_at: string | null;
          selection: Json;
          status: string;
        };
        Insert: {
          away_team?: string | null;
          bet_id: string;
          bet_type: string;
          created_at?: string;
          home_team?: string | null;
          id?: string;
          match_date?: string | null;
          match_id: string;
          odds: number;
          parameter?: Json | null;
          result_determined_at?: string | null;
          selection: Json;
          status?: string;
        };
        Update: {
          away_team?: string | null;
          bet_id?: string;
          bet_type?: string;
          created_at?: string;
          home_team?: string | null;
          id?: string;
          match_date?: string | null;
          match_id?: string;
          odds?: number;
          parameter?: Json | null;
          result_determined_at?: string | null;
          selection?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'betting_bet_legs_bet_id_fkey';
            columns: ['bet_id'];
            isOneToOne: false;
            referencedRelation: 'betting_bets';
            referencedColumns: ['id'];
          },
        ];
      };
      betting_bets: {
        Row: {
          created_at: string;
          id: string;
          odds: number;
          payout: number | null;
          placed_at: string;
          potential_return: number;
          settled_at: string | null;
          stake: number;
          status: string;
          structure: string;
          system_type: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          odds: number;
          payout?: number | null;
          placed_at?: string;
          potential_return: number;
          settled_at?: string | null;
          stake: number;
          status?: string;
          structure: string;
          system_type?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          odds?: number;
          payout?: number | null;
          placed_at?: string;
          potential_return?: number;
          settled_at?: string | null;
          stake?: number;
          status?: string;
          structure?: string;
          system_type?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'betting_bets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      betting_odds: {
        Row: {
          bet_type: string;
          bookmaker_margin: number | null;
          created_at: string | null;
          effective_from: string | null;
          effective_until: string | null;
          id: string;
          implied_probability: number | null;
          match_id: string;
          odds: number;
          odds_change_percentage: number | null;
          parameter: string | null;
          previous_odds: number | null;
          selection: string;
          source: string | null;
          updated_at: string | null;
        };
        Insert: {
          bet_type: string;
          bookmaker_margin?: number | null;
          created_at?: string | null;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: string;
          implied_probability?: number | null;
          match_id: string;
          odds: number;
          odds_change_percentage?: number | null;
          parameter?: string | null;
          previous_odds?: number | null;
          selection: string;
          source?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bet_type?: string;
          bookmaker_margin?: number | null;
          created_at?: string | null;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: string;
          implied_probability?: number | null;
          match_id?: string;
          odds?: number;
          odds_change_percentage?: number | null;
          parameter?: string | null;
          previous_odds?: number | null;
          selection?: string;
          source?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      betting_odds_history: {
        Row: {
          bet_type: string;
          change_percentage: number | null;
          changed_at: string | null;
          id: string;
          match_id: string;
          new_odds: number | null;
          odds_id: string | null;
          old_odds: number | null;
          reason: string | null;
          selection: string;
        };
        Insert: {
          bet_type: string;
          change_percentage?: number | null;
          changed_at?: string | null;
          id?: string;
          match_id: string;
          new_odds?: number | null;
          odds_id?: string | null;
          old_odds?: number | null;
          reason?: string | null;
          selection: string;
        };
        Update: {
          bet_type?: string;
          change_percentage?: number | null;
          changed_at?: string | null;
          id?: string;
          match_id?: string;
          new_odds?: number | null;
          odds_id?: string | null;
          old_odds?: number | null;
          reason?: string | null;
          selection?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'betting_odds_history_odds_id_fkey';
            columns: ['odds_id'];
            isOneToOne: false;
            referencedRelation: 'betting_odds';
            referencedColumns: ['id'];
          },
        ];
      };
      betting_team_elo_ratings: {
        Row: {
          elo_rating: number | null;
          home_advantage: number | null;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          elo_rating?: number | null;
          home_advantage?: number | null;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          elo_rating?: number | null;
          home_advantage?: number | null;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      betting_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          created_at: string;
          description: string;
          id: string;
          metadata: Json | null;
          reference_id: string | null;
          status: string;
          type: string;
          user_id: string;
          wallet_id: string;
        };
        Insert: {
          amount: number;
          balance_after: number;
          created_at?: string;
          description: string;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          status?: string;
          type: string;
          user_id: string;
          wallet_id: string;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          created_at?: string;
          description?: string;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          status?: string;
          type?: string;
          user_id?: string;
          wallet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'betting_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'betting_transactions_wallet_id_fkey';
            columns: ['wallet_id'];
            isOneToOne: false;
            referencedRelation: 'betting_wallets';
            referencedColumns: ['id'];
          },
        ];
      };
      betting_wallets: {
        Row: {
          balance: number;
          created_at: string;
          currency: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'betting_wallets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_posts: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          match_id: string | null;
          published_at: string | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          match_id?: string | null;
          published_at?: string | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          match_id?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'blog_posts_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_posts_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_posts_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['id'];
          },
        ];
      };
      business_partners: {
        Row: {
          address: string | null;
          created_at: string | null;
          description: string;
          discount_percentage: number | null;
          email: string | null;
          id: string;
          level: string;
          logo_url: string | null;
          name: string;
          notes: string | null;
          partnership_type: string;
          phone: string | null;
          start_date: string;
          status: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          description: string;
          discount_percentage?: number | null;
          email?: string | null;
          id?: string;
          level: string;
          logo_url?: string | null;
          name: string;
          notes?: string | null;
          partnership_type: string;
          phone?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          description?: string;
          discount_percentage?: number | null;
          email?: string | null;
          id?: string;
          level?: string;
          logo_url?: string | null;
          name?: string;
          notes?: string | null;
          partnership_type?: string;
          phone?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          age_group: string | null;
          created_at: string | null;
          description: string | null;
          gender: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          slug: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          age_group?: string | null;
          created_at?: string | null;
          description?: string | null;
          gender?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          slug?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          age_group?: string | null;
          created_at?: string | null;
          description?: string | null;
          gender?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          slug?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      category_lineup_members: {
        Row: {
          added_at: string | null;
          added_by: string;
          id: string;
          is_active: boolean | null;
          is_captain: boolean | null;
          is_vice_captain: boolean | null;
          jersey_number: number | null;
          lineup_id: string;
          member_id: string;
          position: string;
        };
        Insert: {
          added_at?: string | null;
          added_by: string;
          id?: string;
          is_active?: boolean | null;
          is_captain?: boolean | null;
          is_vice_captain?: boolean | null;
          jersey_number?: number | null;
          lineup_id: string;
          member_id: string;
          position: string;
        };
        Update: {
          added_at?: string | null;
          added_by?: string;
          id?: string;
          is_active?: boolean | null;
          is_captain?: boolean | null;
          is_vice_captain?: boolean | null;
          jersey_number?: number | null;
          lineup_id?: string;
          member_id?: string;
          position?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_lineup_members_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'category_lineup_members_lineup_id_fkey';
            columns: ['lineup_id'];
            isOneToOne: false;
            referencedRelation: 'category_lineups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineup_members_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      category_lineups: {
        Row: {
          category_id: string;
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          season_id: string;
          updated_at: string | null;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          season_id: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          season_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'category_lineups_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineups_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_lineups_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'category_lineups_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_lineups_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_lineups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'category_lineups_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'category_lineups_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_lineups_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'category_lineups_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      category_membership_fees: {
        Row: {
          calendar_year: number;
          category_id: string;
          created_at: string | null;
          created_by: string | null;
          currency: string;
          description: string | null;
          fee_amount: number;
          fee_period: string | null;
          id: string;
          is_active: boolean | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          calendar_year: number;
          category_id: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          fee_amount: number;
          fee_period?: string | null;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          calendar_year?: number;
          category_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          fee_amount?: number;
          fee_period?: string | null;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'category_membership_fees_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_membership_fees_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_membership_fees_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'category_membership_fees_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_membership_fees_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_membership_fees_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'category_membership_fees_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      category_seasons: {
        Row: {
          allow_team_duplicates: boolean | null;
          category_id: string | null;
          competition_type: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          matchweek_count: number | null;
          season_id: string | null;
          team_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          allow_team_duplicates?: boolean | null;
          category_id?: string | null;
          competition_type?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          matchweek_count?: number | null;
          season_id?: string | null;
          team_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          allow_team_duplicates?: boolean | null;
          category_id?: string | null;
          competition_type?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          matchweek_count?: number | null;
          season_id?: string | null;
          team_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'category_seasons_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_seasons_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_seasons_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'category_seasons_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_seasons_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'category_seasons_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'category_seasons_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_seasons_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'category_seasons_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      club_categories: {
        Row: {
          category_id: string;
          club_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          max_teams: number | null;
          season_id: string;
        };
        Insert: {
          category_id: string;
          club_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_teams?: number | null;
          season_id: string;
        };
        Update: {
          category_id?: string;
          club_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_teams?: number | null;
          season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'club_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'club_categories_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'club_categories_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'club_categories_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_categories_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'club_categories_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      club_category_teams: {
        Row: {
          club_category_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean;
          team_suffix: string;
          updated_at: string | null;
        };
        Insert: {
          club_category_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          team_suffix: string;
          updated_at?: string | null;
        };
        Update: {
          club_category_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean;
          team_suffix?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'club_category_teams_club_category_id_fkey';
            columns: ['club_category_id'];
            isOneToOne: false;
            referencedRelation: 'club_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_category_teams_club_category_id_fkey';
            columns: ['club_category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['id'];
          },
        ];
      };
      club_config: {
        Row: {
          address: string | null;
          club_logo_path: string | null;
          club_logo_url: string | null;
          club_name: string;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          description: string | null;
          facebook_url: string | null;
          founded_year: number | null;
          hero_button_link: string | null;
          hero_button_text: string | null;
          hero_image_path: string | null;
          hero_image_url: string | null;
          hero_subtitle: string | null;
          hero_title: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean | null;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          club_logo_path?: string | null;
          club_logo_url?: string | null;
          club_name?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          hero_button_link?: string | null;
          hero_button_text?: string | null;
          hero_image_path?: string | null;
          hero_image_url?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          club_logo_path?: string | null;
          club_logo_url?: string | null;
          club_name?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          hero_button_link?: string | null;
          hero_button_text?: string | null;
          hero_image_path?: string | null;
          hero_image_url?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      clubs: {
        Row: {
          address: string | null;
          city: string | null;
          contact_person: string | null;
          created_at: string | null;
          description: string | null;
          email: string | null;
          founded_year: number | null;
          id: string;
          is_active: boolean | null;
          is_own_club: boolean | null;
          logo_url: string | null;
          name: string;
          phone: string | null;
          short_name: string | null;
          updated_at: string | null;
          venue: string | null;
          web: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          contact_person?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          founded_year?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_own_club?: boolean | null;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          short_name?: string | null;
          updated_at?: string | null;
          venue?: string | null;
          web?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          contact_person?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          founded_year?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_own_club?: boolean | null;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          short_name?: string | null;
          updated_at?: string | null;
          venue?: string | null;
          web?: string | null;
        };
        Relationships: [];
      };
      coach_categories: {
        Row: {
          category_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'coach_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coach_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'coach_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'coach_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'coach_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'coach_categories_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'coach_categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      comments: {
        Row: {
          author: string;
          content: string;
          created_at: string | null;
          id: string;
          type: string | null;
          updated_at: string | null;
          user_email: string;
        };
        Insert: {
          author: string;
          content: string;
          created_at?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
          user_email: string;
        };
        Update: {
          author?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
          user_email?: string;
        };
        Relationships: [];
      };
      committees: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      external_players: {
        Row: {
          club_id: string | null;
          club_name: string | null;
          created_at: string | null;
          id: string;
          name: string;
          position: string;
          registration_number: string;
          surname: string;
          updated_at: string | null;
        };
        Insert: {
          club_id?: string | null;
          club_name?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          position: string;
          registration_number: string;
          surname: string;
          updated_at?: string | null;
        };
        Update: {
          club_id?: string | null;
          club_name?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          position?: string;
          registration_number?: string;
          surname?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      grants: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          month: number;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          month: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          month?: number;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grants_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lineup_coaches: {
        Row: {
          created_at: string | null;
          id: string;
          lineup_id: string;
          member_id: string;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          lineup_id: string;
          member_id: string;
          role: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          lineup_id?: string;
          member_id?: string;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lineup_coaches_lineup_id_fkey';
            columns: ['lineup_id'];
            isOneToOne: false;
            referencedRelation: 'lineups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_coaches_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      lineup_players: {
        Row: {
          created_at: string | null;
          goals: number | null;
          id: string;
          is_captain: boolean | null;
          jersey_number: number | null;
          lineup_id: string;
          member_id: string;
          position: string;
          red_cards_10min: number | null;
          red_cards_5min: number | null;
          red_cards_personal: number | null;
          updated_at: string | null;
          yellow_cards: number | null;
        };
        Insert: {
          created_at?: string | null;
          goals?: number | null;
          id?: string;
          is_captain?: boolean | null;
          jersey_number?: number | null;
          lineup_id: string;
          member_id: string;
          position: string;
          red_cards_10min?: number | null;
          red_cards_5min?: number | null;
          red_cards_personal?: number | null;
          updated_at?: string | null;
          yellow_cards?: number | null;
        };
        Update: {
          created_at?: string | null;
          goals?: number | null;
          id?: string;
          is_captain?: boolean | null;
          jersey_number?: number | null;
          lineup_id?: string;
          member_id?: string;
          position?: string;
          red_cards_10min?: number | null;
          red_cards_5min?: number | null;
          red_cards_personal?: number | null;
          updated_at?: string | null;
          yellow_cards?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lineup_players_lineup_id_fkey';
            columns: ['lineup_id'];
            isOneToOne: false;
            referencedRelation: 'lineups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineup_players_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      lineups: {
        Row: {
          created_at: string | null;
          id: string;
          is_home_team: boolean;
          match_id: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_home_team: boolean;
          match_id: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_home_team?: boolean;
          match_id?: string;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lineups_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineups_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineups_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lineups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
        ];
      };
      login_logs: {
        Row: {
          action: string;
          created_at: string | null;
          email: string;
          id: string;
          ip_address: string | null;
          login_time: string | null;
          session_id: string | null;
          status: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action?: string;
          created_at?: string | null;
          email: string;
          id?: string;
          ip_address?: string | null;
          login_time?: string | null;
          session_id?: string | null;
          status: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          email?: string;
          id?: string;
          ip_address?: string | null;
          login_time?: string | null;
          session_id?: string | null;
          status?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      main_partners: {
        Row: {
          benefits: Json | null;
          contact_email: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          created_at: string | null;
          description: string | null;
          end_date: string;
          id: string;
          level: string;
          logo_url: string | null;
          name: string;
          notes: string | null;
          start_date: string;
          status: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          benefits?: Json | null;
          contact_email?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_date: string;
          id?: string;
          level: string;
          logo_url?: string | null;
          name: string;
          notes?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          benefits?: Json | null;
          contact_email?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_date?: string;
          id?: string;
          level?: string;
          logo_url?: string | null;
          name?: string;
          notes?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      match_metadata: {
        Row: {
          content: string | null;
          created_at: string | null;
          created_by: string | null;
          file_name: string | null;
          file_size: number | null;
          file_url: string | null;
          id: string;
          is_primary: boolean | null;
          match_id: string;
          metadata: Json | null;
          metadata_type: string;
          mime_type: string | null;
          updated_at: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_primary?: boolean | null;
          match_id: string;
          metadata?: Json | null;
          metadata_type: string;
          mime_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_primary?: boolean | null;
          match_id?: string;
          metadata?: Json | null;
          metadata_type?: string;
          mime_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_metadata_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_metadata_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_metadata_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_metadata_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['id'];
          },
        ];
      };
      match_videos: {
        Row: {
          created_at: string | null;
          id: string;
          match_id: string;
          updated_at: string | null;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          match_id: string;
          updated_at?: string | null;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          match_id?: string;
          updated_at?: string | null;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_videos_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_videos_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_videos_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_videos_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          away_score: number | null;
          away_score_halftime: number | null;
          away_team_id: string | null;
          category_id: string | null;
          coach_notes: string | null;
          competition: string;
          created_at: string | null;
          date: string;
          home_score: number | null;
          home_score_halftime: number | null;
          home_team_id: string | null;
          id: string;
          is_home: boolean | null;
          match_number: string | null;
          matchweek: number | null;
          post_id: string | null;
          season_id: string | null;
          status: string | null;
          time: string;
          updated_at: string | null;
          venue: string;
        };
        Insert: {
          away_score?: number | null;
          away_score_halftime?: number | null;
          away_team_id?: string | null;
          category_id?: string | null;
          coach_notes?: string | null;
          competition: string;
          created_at?: string | null;
          date: string;
          home_score?: number | null;
          home_score_halftime?: number | null;
          home_team_id?: string | null;
          id?: string;
          is_home?: boolean | null;
          match_number?: string | null;
          matchweek?: number | null;
          post_id?: string | null;
          season_id?: string | null;
          status?: string | null;
          time: string;
          updated_at?: string | null;
          venue: string;
        };
        Update: {
          away_score?: number | null;
          away_score_halftime?: number | null;
          away_team_id?: string | null;
          category_id?: string | null;
          coach_notes?: string | null;
          competition?: string;
          created_at?: string | null;
          date?: string;
          home_score?: number | null;
          home_score_halftime?: number | null;
          home_team_id?: string | null;
          id?: string;
          is_home?: boolean | null;
          match_number?: string | null;
          matchweek?: number | null;
          post_id?: string | null;
          season_id?: string | null;
          status?: string | null;
          time?: string;
          updated_at?: string | null;
          venue?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      media_partners: {
        Row: {
          coverage: string;
          coverage_details: Json | null;
          created_at: string | null;
          description: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          media_type: string;
          monthly_value_czk: number | null;
          name: string;
          notes: string | null;
          phone: string | null;
          start_date: string;
          status: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          coverage: string;
          coverage_details?: Json | null;
          created_at?: string | null;
          description: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          media_type: string;
          monthly_value_czk?: number | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          coverage?: string;
          coverage_details?: Json | null;
          created_at?: string | null;
          description?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          media_type?: string;
          monthly_value_czk?: number | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      meeting_attendees: {
        Row: {
          created_at: string | null;
          id: string;
          meeting_minutes_id: string;
          notes: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          meeting_minutes_id: string;
          notes?: string | null;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          meeting_minutes_id?: string;
          notes?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_attendees_meeting_minutes_id_fkey';
            columns: ['meeting_minutes_id'];
            isOneToOne: false;
            referencedRelation: 'meeting_minutes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_attendees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      meeting_minutes: {
        Row: {
          attachment_filename: string | null;
          attachment_url: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          meeting_date: string;
          meeting_number: number;
          meeting_place: string | null;
          season_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
          wrote_by: string | null;
        };
        Insert: {
          attachment_filename?: string | null;
          attachment_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          meeting_date: string;
          meeting_number: number;
          meeting_place?: string | null;
          season_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wrote_by?: string | null;
        };
        Update: {
          attachment_filename?: string | null;
          attachment_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          meeting_date?: string;
          meeting_number?: number;
          meeting_place?: string | null;
          season_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wrote_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_minutes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'meeting_minutes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'meeting_minutes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_minutes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'meeting_minutes_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'meeting_minutes_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'meeting_minutes_wrote_by_fkey';
            columns: ['wrote_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      member_attendance: {
        Row: {
          attendance_status: string;
          created_at: string | null;
          id: string;
          member_id: string;
          notes: string | null;
          recorded_at: string | null;
          recorded_by: string;
          training_session_id: string;
          updated_at: string | null;
        };
        Insert: {
          attendance_status?: string;
          created_at?: string | null;
          id?: string;
          member_id: string;
          notes?: string | null;
          recorded_at?: string | null;
          recorded_by: string;
          training_session_id: string;
          updated_at?: string | null;
        };
        Update: {
          attendance_status?: string;
          created_at?: string | null;
          id?: string;
          member_id?: string;
          notes?: string | null;
          recorded_at?: string | null;
          recorded_by?: string;
          training_session_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_attendance_recorded_by_fkey';
            columns: ['recorded_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'member_attendance_training_session_id_fkey';
            columns: ['training_session_id'];
            isOneToOne: false;
            referencedRelation: 'training_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      member_club_relationships: {
        Row: {
          club_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          member_id: string;
          notes: string | null;
          relationship_type: string;
          status: string;
          updated_at: string | null;
          valid_from: string;
          valid_to: string | null;
        };
        Insert: {
          club_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          member_id: string;
          notes?: string | null;
          relationship_type: string;
          status?: string;
          updated_at?: string | null;
          valid_from: string;
          valid_to?: string | null;
        };
        Update: {
          club_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          member_id?: string;
          notes?: string | null;
          relationship_type?: string;
          status?: string;
          updated_at?: string | null;
          valid_from?: string;
          valid_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'club_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_club_relationships_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      member_functions: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_name: string;
          id: string;
          is_active: boolean | null;
          name: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      member_metadata: {
        Row: {
          address: string | null;
          allergies: string | null;
          created_at: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          id: string;
          jersey_size: string | null;
          medical_notes: string | null;
          member_id: string;
          notes: string | null;
          parent_email: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          phone: string | null;
          preferred_position: string | null;
          shoe_size: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          allergies?: string | null;
          created_at?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          id?: string;
          jersey_size?: string | null;
          medical_notes?: string | null;
          member_id: string;
          notes?: string | null;
          parent_email?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          phone?: string | null;
          preferred_position?: string | null;
          shoe_size?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          allergies?: string | null;
          created_at?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          id?: string;
          jersey_size?: string | null;
          medical_notes?: string | null;
          member_id?: string;
          notes?: string | null;
          parent_email?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          phone?: string | null;
          preferred_position?: string | null;
          shoe_size?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'member_metadata_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: true;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
        ];
      };
      members: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          functions: string[] | null;
          id: string;
          is_active: boolean;
          name: string;
          registration_number: string;
          sex: string;
          surname: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          functions?: string[] | null;
          id?: string;
          is_active?: boolean;
          name: string;
          registration_number: string;
          sex: string;
          surname: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          functions?: string[] | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          registration_number?: string;
          sex?: string;
          surname?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      membership_fee_payments: {
        Row: {
          amount: number;
          calendar_year: number;
          category_id: string;
          created_at: string | null;
          created_by: string | null;
          currency: string;
          fee_type: string | null;
          id: string;
          member_id: string;
          notes: string | null;
          payment_date: string;
          payment_method: string | null;
          payment_reference: string | null;
          receipt_number: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          amount: number;
          calendar_year: number;
          category_id: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          fee_type?: string | null;
          id?: string;
          member_id: string;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          receipt_number?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          amount?: number;
          calendar_year?: number;
          category_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          fee_type?: string | null;
          id?: string;
          member_id?: string;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          receipt_number?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'membership_fee_payments_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'membership_fee_payments_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'member_fee_status';
            referencedColumns: ['member_id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_external';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_internal';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_on_loan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_metadata';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'members_with_payment_status';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_fee_payments_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      migration_log: {
        Row: {
          description: string | null;
          executed_at: string | null;
          id: number;
          migration_name: string;
        };
        Insert: {
          description?: string | null;
          executed_at?: string | null;
          id?: number;
          migration_name: string;
        };
        Update: {
          description?: string | null;
          executed_at?: string | null;
          id?: number;
          migration_name?: string;
        };
        Relationships: [];
      };
      page_visibility: {
        Row: {
          category: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_visible: boolean | null;
          page_description: string | null;
          page_key: string;
          page_route: string;
          page_title: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_visible?: boolean | null;
          page_description?: string | null;
          page_key: string;
          page_route: string;
          page_title: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_visible?: boolean | null;
          page_description?: string | null;
          page_key?: string;
          page_route?: string;
          page_title?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      photo_albums: {
        Row: {
          cover_photo_url: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          sort_order: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          cover_photo_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          sort_order?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          cover_photo_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          sort_order?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'photo_albums_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      photos: {
        Row: {
          album_id: string;
          created_at: string | null;
          description: string | null;
          file_path: string;
          file_size: number | null;
          file_url: string;
          height: number | null;
          id: string;
          is_featured: boolean | null;
          mime_type: string | null;
          sort_order: number | null;
          title: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          width: number | null;
        };
        Insert: {
          album_id: string;
          created_at?: string | null;
          description?: string | null;
          file_path: string;
          file_size?: number | null;
          file_url: string;
          height?: number | null;
          id?: string;
          is_featured?: boolean | null;
          mime_type?: string | null;
          sort_order?: number | null;
          title?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Update: {
          album_id?: string;
          created_at?: string | null;
          description?: string | null;
          file_path?: string;
          file_size?: number | null;
          file_url?: string;
          height?: number | null;
          id?: string;
          is_featured?: boolean | null;
          mime_type?: string | null;
          sort_order?: number | null;
          title?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'photos_album_id_fkey';
            columns: ['album_id'];
            isOneToOne: false;
            referencedRelation: 'photo_albums';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photos_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          assigned_categories: string[] | null;
          bio: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string | null;
          id: string;
          is_blocked: boolean | null;
          phone: string | null;
          position: string | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_categories?: string[] | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          phone?: string | null;
          position?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_categories?: string[] | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          phone?: string | null;
          position?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      seasons: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          is_active: boolean | null;
          is_closed: boolean | null;
          name: string;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_active?: boolean | null;
          is_closed?: boolean | null;
          name: string;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_active?: boolean | null;
          is_closed?: boolean | null;
          name?: string;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sponsorship_packages: {
        Row: {
          benefits: Json | null;
          created_at: string | null;
          currency: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          level: string;
          name: string;
          price_czk: number;
          updated_at: string | null;
          validity_months: number;
        };
        Insert: {
          benefits?: Json | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          level: string;
          name: string;
          price_czk: number;
          updated_at?: string | null;
          validity_months: number;
        };
        Update: {
          benefits?: Json | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          level?: string;
          name?: string;
          price_czk?: number;
          updated_at?: string | null;
          validity_months?: number;
        };
        Relationships: [];
      };
      standings: {
        Row: {
          category_id: string | null;
          club_id: string | null;
          created_at: string | null;
          draws: number | null;
          goals_against: number | null;
          goals_for: number | null;
          id: string;
          losses: number | null;
          matches: number | null;
          points: number | null;
          position: number;
          season_id: string | null;
          team_id: string | null;
          updated_at: string | null;
          wins: number | null;
        };
        Insert: {
          category_id?: string | null;
          club_id?: string | null;
          created_at?: string | null;
          draws?: number | null;
          goals_against?: number | null;
          goals_for?: number | null;
          id?: string;
          losses?: number | null;
          matches?: number | null;
          points?: number | null;
          position: number;
          season_id?: string | null;
          team_id?: string | null;
          updated_at?: string | null;
          wins?: number | null;
        };
        Update: {
          category_id?: string | null;
          club_id?: string | null;
          created_at?: string | null;
          draws?: number | null;
          goals_against?: number | null;
          goals_for?: number | null;
          id?: string;
          losses?: number | null;
          matches?: number | null;
          points?: number | null;
          position?: number;
          season_id?: string | null;
          team_id?: string | null;
          updated_at?: string | null;
          wins?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'standings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'standings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'standings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'standings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'club_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'standings_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'standings_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'standings_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'standings_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'standings_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
        ];
      };
      todos: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          user_email: string;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          user_email: string;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          user_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'todos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      training_sessions: {
        Row: {
          category_id: string | null;
          coach_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          location: string | null;
          season_id: string;
          session_date: string;
          session_time: string | null;
          status: string;
          status_reason: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          coach_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          location?: string | null;
          season_id: string;
          session_date: string;
          session_time?: string | null;
          status?: string;
          status_reason?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          coach_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          location?: string | null;
          season_id?: string;
          session_date?: string;
          session_time?: string | null;
          status?: string;
          status_reason?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'training_sessions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_sessions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'training_sessions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'training_sessions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'training_sessions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'training_sessions_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'training_sessions_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'training_sessions_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_sessions_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'training_sessions_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          assigned_categories: string[] | null;
          created_at: string | null;
          id: string;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_categories?: string[] | null;
          created_at?: string | null;
          id?: string;
          role?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_categories?: string[] | null;
          created_at?: string | null;
          id?: string;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      videos: {
        Row: {
          category_id: string;
          club_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          duration: string | null;
          id: string;
          is_active: boolean | null;
          recording_date: string | null;
          season_id: string | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          updated_by: string | null;
          youtube_id: string;
          youtube_url: string;
        };
        Insert: {
          category_id: string;
          club_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration?: string | null;
          id?: string;
          is_active?: boolean | null;
          recording_date?: string | null;
          season_id?: string | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          updated_by?: string | null;
          youtube_id: string;
          youtube_url: string;
        };
        Update: {
          category_id?: string;
          club_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration?: string | null;
          id?: string;
          is_active?: boolean | null;
          recording_date?: string | null;
          season_id?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          youtube_id?: string;
          youtube_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'club_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['away_club_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['home_club_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'videos_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['club_id'];
          },
          {
            foreignKeyName: 'videos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'videos_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'videos_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'videos_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'videos_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'betting_leaderboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
    };
    Views: {
      betting_leaderboard: {
        Row: {
          current_balance: number | null;
          lost_bets: number | null;
          net_profit: number | null;
          roi: number | null;
          total_bets: number | null;
          total_wagered: number | null;
          total_winnings: number | null;
          user_id: string | null;
          user_name: string | null;
          win_rate: number | null;
          won_bets: number | null;
        };
        Relationships: [];
      };
      club_category_details: {
        Row: {
          category_description: string | null;
          category_id: string | null;
          category_name: string | null;
          club_name: string | null;
          club_short_name: string | null;
          created_at: string | null;
          current_teams: number | null;
          id: string | null;
          is_active: boolean | null;
          max_teams: number | null;
        };
        Relationships: [];
      };
      club_overview: {
        Row: {
          active_categories: number | null;
          active_teams: number | null;
          city: string | null;
          created_at: string | null;
          id: string | null;
          name: string | null;
          short_name: string | null;
          total_categories: number | null;
          total_teams: number | null;
        };
        Relationships: [];
      };
      match_stats: {
        Row: {
          avg_goals_per_match: number | null;
          category_id: string | null;
          completed_matches: number | null;
          first_match_date: string | null;
          last_match_date: string | null;
          season_id: string | null;
          total_matches: number | null;
          upcoming_matches: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      matches_with_teams_optimized: {
        Row: {
          away_club_id: string | null;
          away_club_is_own_club: boolean | null;
          away_club_logo_url: string | null;
          away_club_name: string | null;
          away_club_short_name: string | null;
          away_score: number | null;
          away_score_halftime: number | null;
          away_team_club_category_id: string | null;
          away_team_id: string | null;
          away_team_suffix: string | null;
          category_id: string | null;
          competition: string | null;
          created_at: string | null;
          date: string | null;
          home_club_id: string | null;
          home_club_is_own_club: boolean | null;
          home_club_logo_url: string | null;
          home_club_name: string | null;
          home_club_short_name: string | null;
          home_score: number | null;
          home_score_halftime: number | null;
          home_team_club_category_id: string | null;
          home_team_id: string | null;
          home_team_suffix: string | null;
          id: string | null;
          match_number: string | null;
          matchweek: number | null;
          season_id: string | null;
          status: string | null;
          time: string | null;
          updated_at: string | null;
          venue: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      member_fee_status: {
        Row: {
          calendar_year: number | null;
          category_id: string | null;
          category_name: string | null;
          currency: string | null;
          expected_fee_amount: number | null;
          last_payment_date: string | null;
          member_id: string | null;
          name: string | null;
          net_paid: number | null;
          payment_count: number | null;
          payment_status: string | null;
          registration_number: string | null;
          surname: string | null;
          total_paid: number | null;
          total_refunded: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      members_external: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          functions: string[] | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          notes: string | null;
          origin_club_name: string | null;
          origin_club_short_name: string | null;
          registration_number: string | null;
          relationship_status: string | null;
          relationship_type: string | null;
          sex: string | null;
          surname: string | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      members_internal: {
        Row: {
          calendar_year: number | null;
          category_id: string | null;
          category_name: string | null;
          club_name: string | null;
          created_at: string | null;
          currency: string | null;
          date_of_birth: string | null;
          expected_fee_amount: number | null;
          functions: string[] | null;
          id: string | null;
          is_active: boolean | null;
          last_payment_date: string | null;
          name: string | null;
          net_paid: number | null;
          payment_count: number | null;
          payment_status: string | null;
          registration_number: string | null;
          relationship_status: string | null;
          relationship_type: string | null;
          sex: string | null;
          surname: string | null;
          total_paid: number | null;
          total_refunded: number | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      members_on_loan: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          functions: string[] | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          notes: string | null;
          origin_club_name: string | null;
          origin_club_short_name: string | null;
          registration_number: string | null;
          relationship_status: string | null;
          relationship_type: string | null;
          sex: string | null;
          surname: string | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      members_with_metadata: {
        Row: {
          address: string | null;
          allergies: string | null;
          category_id: string | null;
          category_name: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          functions: string[] | null;
          id: string | null;
          jersey_size: string | null;
          medical_notes: string | null;
          name: string | null;
          notes: string | null;
          parent_email: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          phone: string | null;
          preferred_position: string | null;
          registration_number: string | null;
          sex: string | null;
          shoe_size: string | null;
          surname: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      members_with_payment_status: {
        Row: {
          category_id: string | null;
          category_name: string | null;
          created_at: string | null;
          currency: string | null;
          date_of_birth: string | null;
          expected_fee_amount: number | null;
          functions: string[] | null;
          id: string | null;
          is_active: boolean | null;
          last_payment_date: string | null;
          name: string | null;
          net_paid: number | null;
          payment_count: number | null;
          payment_status: string | null;
          payment_year: number | null;
          registration_number: string | null;
          sex: string | null;
          surname: string | null;
          total_paid: number | null;
          total_refunded: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'members_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
        ];
      };
      own_club_matches: {
        Row: {
          away_club_id: string | null;
          away_club_logo_url: string | null;
          away_club_name: string | null;
          away_club_short_name: string | null;
          away_is_own_club: boolean | null;
          away_score: number | null;
          away_score_halftime: number | null;
          away_team_id: string | null;
          away_team_suffix: string | null;
          category_description: string | null;
          category_id: string | null;
          category_id_full: string | null;
          category_name: string | null;
          category_slug: string | null;
          competition: string | null;
          created_at: string | null;
          date: string | null;
          home_club_id: string | null;
          home_club_logo_url: string | null;
          home_club_name: string | null;
          home_club_short_name: string | null;
          home_is_own_club: boolean | null;
          home_score: number | null;
          home_score_halftime: number | null;
          home_team_id: string | null;
          home_team_suffix: string | null;
          id: string | null;
          match_number: string | null;
          matchweek: number | null;
          season_end_date: string | null;
          season_id: string | null;
          season_id_full: string | null;
          season_name: string | null;
          season_start_date: string | null;
          status: string | null;
          time: string | null;
          updated_at: string | null;
          venue: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey';
            columns: ['away_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['away_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'matches_with_teams_optimized';
            referencedColumns: ['home_team_club_category_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'team_suffix_helper';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_home_team_id_fkey';
            columns: ['home_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['season_id_full'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['season_id'];
          },
          {
            foreignKeyName: 'matches_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['season_id'];
          },
        ];
      };
      team_details: {
        Row: {
          category_name: string | null;
          club_category_active: boolean | null;
          club_logo: string | null;
          club_name: string | null;
          club_short_name: string | null;
          display_name: string | null;
          full_name: string | null;
          max_teams: number | null;
          season_active: boolean | null;
          season_name: string | null;
          team_active: boolean | null;
          team_id: string | null;
          team_suffix: string | null;
        };
        Relationships: [];
      };
      team_suffix_helper: {
        Row: {
          category_id: string | null;
          category_name: string | null;
          club_category_id: string | null;
          club_name: string | null;
          team_id: string | null;
          team_suffix: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'own_club_matches';
            referencedColumns: ['category_id_full'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'teams_with_details';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'club_category_teams_club_category_id_fkey';
            columns: ['club_category_id'];
            isOneToOne: false;
            referencedRelation: 'club_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_category_teams_club_category_id_fkey';
            columns: ['club_category_id'];
            isOneToOne: false;
            referencedRelation: 'club_category_details';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          category_id: string | null;
          category_name: string | null;
          club_id: string | null;
          club_name: string | null;
          club_short_name: string | null;
          created_at: string | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          season_id: string | null;
          season_name: string | null;
          short_name: string | null;
          team_suffix: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      teams_with_details: {
        Row: {
          age_group: string | null;
          category_id: string | null;
          category_name: string | null;
          club_id: string | null;
          club_logo_url: string | null;
          club_name: string | null;
          club_short_name: string | null;
          created_at: string | null;
          gender: string | null;
          is_active: boolean | null;
          is_own_club: boolean | null;
          season_end_date: string | null;
          season_id: string | null;
          season_is_active: boolean | null;
          season_name: string | null;
          season_start_date: string | null;
          sort_order: number | null;
          team_display_name: string | null;
          team_id: string | null;
          team_short_name: string | null;
          team_suffix: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      ensure_user_profile: {
        Args: {input_user_id: string};
        Returns: string;
      };
      exec_sql: {
        Args: {sql: string};
        Returns: string;
      };
      generate_teams_for_club_category: {
        Args: {p_club_category_id: string; p_max_teams?: number};
        Returns: undefined;
      };
      get_active_members_for_club: {
        Args: {club_uuid: string};
        Returns: {
          member_id: string;
          member_name: string;
          member_surname: string;
          registration_number: string;
          relationship_type: string;
          valid_from: string;
          valid_to: string;
        }[];
      };
      get_attendance_records: {
        Args: {p_session_id: string; p_user_id: string};
        Returns: {
          attendance_status: string;
          id: string;
          member_id: string;
          member_name: string;
          member_surname: string;
          notes: string;
          recorded_at: string;
        }[];
      };
      get_attendance_summary: {
        Args:
          | {p_category: string; p_season_id: string}
          | {p_category_id: string; p_season_id: string; p_user_id: string};
        Returns: {
          absent_count: number;
          excused_count: number;
          late_count: number;
          present_count: number;
          session_date: string;
          session_id: string;
          session_title: string;
          total_members: number;
        }[];
      };
      get_current_club_for_member: {
        Args: {member_uuid: string};
        Returns: {
          club_id: string;
          club_name: string;
          relationship_type: string;
          valid_from: string;
          valid_to: string;
        }[];
      };
      get_current_user_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          assigned_categories: string[];
          assigned_category_codes: string[];
          assigned_category_names: string[];
          email: string;
          full_name: string;
          profile_role: string;
          roles: string[];
          user_id: string;
        }[];
      };
      get_match_stats: {
        Args: {p_category_id: string; p_season_id: string};
        Returns: {
          avg_goals_per_match: number;
          completed_matches: number;
          first_match_date: string;
          last_match_date: string;
          total_matches: number;
          upcoming_matches: number;
        }[];
      };
      get_member_club_history: {
        Args: {member_uuid: string};
        Returns: {
          club_id: string;
          club_name: string;
          notes: string;
          relationship_type: string;
          status: string;
          valid_from: string;
          valid_to: string;
        }[];
      };
      get_member_fee_status_for_year: {
        Args: {p_calendar_year: number; p_member_id: string};
        Returns: {
          expected_fee: number;
          payment_count: number;
          payment_status: string;
          total_paid: number;
        }[];
      };
      get_or_create_external_player: {
        Args: {
          p_club_id?: string;
          p_club_name?: string;
          p_name: string;
          p_position: string;
          p_registration_number: string;
          p_surname: string;
        };
        Returns: string;
      };
      get_sponsorship_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_business_partners: number;
          active_main_partners: number;
          active_media_partners: number;
          total_business_partners: number;
          total_main_partners: number;
          total_media_partners: number;
          total_monthly_value_czk: number;
        }[];
      };
      get_teams_for_category_season: {
        Args: {p_category_id: string; p_season_id: string};
        Returns: {
          club_logo: string;
          club_name: string;
          club_short_name: string;
          display_name: string;
          full_name: string;
          team_id: string;
          team_suffix: string;
        }[];
      };
      get_training_sessions: {
        Args: {p_category_id: string; p_season_id: string; p_user_id: string};
        Returns: {
          coach_id: string;
          created_at: string;
          description: string;
          id: string;
          location: string;
          session_date: string;
          session_time: string;
          title: string;
        }[];
      };
      get_user_coach_categories: {
        Args: {user_uuid: string};
        Returns: {
          category_code: string;
          category_id: string;
          category_name: string;
        }[];
      };
      get_user_profile_safe: {
        Args: {user_uuid: string};
        Returns: {
          assigned_categories: string[];
          club_id: string;
          created_at: string;
          role: string;
          user_id: string;
        }[];
      };
      get_user_roles: {
        Args: {user_uuid: string};
        Returns: {
          role: string;
        }[];
      };
      get_user_summary_by_id: {
        Args: {target_user_id: string};
        Returns: {
          assigned_categories: string[];
          assigned_category_codes: string[];
          assigned_category_names: string[];
          email: string;
          full_name: string;
          profile_role: string;
          roles: string[];
          user_id: string;
        }[];
      };
      has_admin_access: {
        Args: {user_uuid?: string};
        Returns: boolean;
      };
      has_role: {
        Args: {role_name: string; user_uuid: string};
        Returns: boolean;
      };
      is_admin: {
        Args: {user_uuid?: string};
        Returns: boolean;
      };
      populate_profiles_additional_fields: {
        Args: Record<PropertyKey, never>;
        Returns: {
          message: string;
          updated_count: number;
        }[];
      };
      populate_profiles_from_auth_users: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_betting_leaderboard: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_match_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_materialized_view: {
        Args: {view_name: string};
        Returns: undefined;
      };
      refresh_profiles_mv: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_profiles_mv_with_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          message: string;
          refreshed_at: string;
          total_profiles: number;
        }[];
      };
      refresh_teams_materialized_view: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      search_external_players: {
        Args: {search_term: string};
        Returns: {
          club_id: string;
          club_name: string;
          display_name: string;
          id: string;
          name: string;
          position: string;
          registration_number: string;
          surname: string;
        }[];
      };
      set_album_cover_photo: {
        Args: {album_uuid: string};
        Returns: undefined;
      };
      sync_all_profiles_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          message: string;
          refreshed_at: string;
          synced_users: number;
          total_profiles: number;
        }[];
      };
      sync_profiles_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          message: string;
          synced_count: number;
        }[];
      };
      sync_profiles_from_user_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: {
          message: string;
          synced_count: number;
          total_profiles: number;
        }[];
      };
      user_has_profile: {
        Args: {user_uuid: string};
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | {schema: keyof DatabaseWithoutInternals},
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | {schema: keyof DatabaseWithoutInternals},
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | {schema: keyof DatabaseWithoutInternals},
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | {schema: keyof DatabaseWithoutInternals},
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | {schema: keyof DatabaseWithoutInternals},
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      cafe_locations: {
        Row: {
          active: boolean
          address: string
          created_at: string
          display_order: number
          id: string
          image_path: string | null
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          image: string
          is_subscription: boolean
          name: string
          original_price: number
          pack_size: number
          price: number
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image: string
          is_subscription?: boolean
          name: string
          original_price: number
          pack_size: number
          price: number
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image?: string
          is_subscription?: boolean
          name?: string
          original_price?: number
          pack_size?: number
          price?: number
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chicken_pickup_centers: {
        Row: {
          active: boolean
          address: string
          center_code: string | null
          created_at: string
          display_order: number
          google_maps_url: string | null
          id: string
          image_path: string | null
          latitude: number | null
          longitude: number | null
          name: string
          pickup_instructions: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          address?: string
          center_code?: string | null
          created_at?: string
          display_order?: number
          google_maps_url?: string | null
          id?: string
          image_path?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          pickup_instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          center_code?: string | null
          created_at?: string
          display_order?: number
          google_maps_url?: string | null
          id?: string
          image_path?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          pickup_instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      chicken_pickup_verifications: {
        Row: {
          customer_id: string
          expires_at: string | null
          generated_at: string
          handed_over_at: string | null
          handed_over_by: string | null
          id: string
          order_id: string
          pickup_center_id: string
          pickup_code: string
          pickup_status: string
          verification_center_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          customer_id: string
          expires_at?: string | null
          generated_at?: string
          handed_over_at?: string | null
          handed_over_by?: string | null
          id?: string
          order_id: string
          pickup_center_id: string
          pickup_code: string
          pickup_status?: string
          verification_center_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          customer_id?: string
          expires_at?: string | null
          generated_at?: string
          handed_over_at?: string | null
          handed_over_by?: string | null
          id?: string
          order_id?: string
          pickup_center_id?: string
          pickup_code?: string
          pickup_status?: string
          verification_center_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chicken_pickup_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chicken_pickup_verifications_pickup_center_id_fkey"
            columns: ["pickup_center_id"]
            isOneToOne: false
            referencedRelation: "chicken_pickup_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      chicken_products: {
        Row: {
          active: boolean
          archived: boolean
          available: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_path: string | null
          name: string
          offer_price: number | null
          price: number
          updated_at: string
          updated_by: string | null
          weight: string | null
        }
        Insert: {
          active?: boolean
          archived?: boolean
          available?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_path?: string | null
          name: string
          offer_price?: number | null
          price: number
          updated_at?: string
          updated_by?: string | null
          weight?: string | null
        }
        Update: {
          active?: boolean
          archived?: boolean
          available?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_path?: string | null
          name?: string
          offer_price?: number | null
          price?: number
          updated_at?: string
          updated_by?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      communities: {
        Row: {
          city: string
          created_at: string
          delivery_hours: string
          id: string
          is_active: boolean | null
          is_visible_production: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          pincode: string | null
          radius: number
        }
        Insert: {
          city?: string
          created_at?: string
          delivery_hours?: string
          id?: string
          is_active?: boolean | null
          is_visible_production?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          pincode?: string | null
          radius?: number
        }
        Update: {
          city?: string
          created_at?: string
          delivery_hours?: string
          id?: string
          is_active?: boolean | null
          is_visible_production?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          pincode?: string | null
          radius?: number
        }
        Relationships: []
      }
      email_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          business: string
          community: string
          created_at: string
          customer_name: string | null
          delivery_slot: string | null
          fulfillment_type: string
          id: string
          is_paused: boolean | null
          items: Json
          order_status: string | null
          paused_at: string | null
          payment_id: string | null
          payment_status: string | null
          phone: string
          pickup_center_id: string | null
          resume_at: string | null
          subscription_end_date: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          business?: string
          community: string
          created_at?: string
          customer_name?: string | null
          delivery_slot?: string | null
          fulfillment_type?: string
          id?: string
          is_paused?: boolean | null
          items: Json
          order_status?: string | null
          paused_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone: string
          pickup_center_id?: string | null
          resume_at?: string | null
          subscription_end_date?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          business?: string
          community?: string
          created_at?: string
          customer_name?: string | null
          delivery_slot?: string | null
          fulfillment_type?: string
          id?: string
          is_paused?: boolean | null
          items?: Json
          order_status?: string | null
          paused_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone?: string
          pickup_center_id?: string | null
          resume_at?: string | null
          subscription_end_date?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_pickup_center_fk"
            columns: ["pickup_center_id"]
            isOneToOne: false
            referencedRelation: "chicken_pickup_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_issues: {
        Row: {
          admin_notes: string | null
          amount: number | null
          created_at: string
          description: string | null
          id: string
          order_screenshot_url: string | null
          screenshot_url: string | null
          status: string
          ticket_number: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_screenshot_url?: string | null
          screenshot_url?: string | null
          status?: string
          ticket_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_screenshot_url?: string | null
          screenshot_url?: string | null
          status?: string
          ticket_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          created_at: string
          expires_at: string
          otp_hash: string
          phone: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          otp_hash: string
          phone: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          otp_hash?: string
          phone?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          buy_once_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          original_price: number | null
          price: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          buy_once_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          original_price?: number | null
          price: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          buy_once_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          community: string | null
          created_at: string
          email: string | null
          email_verified: boolean
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          referral_code: string | null
          updated_at: string
          wallet_balance: number | null
        }
        Insert: {
          address?: string | null
          community?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          referral_code?: string | null
          updated_at?: string
          wallet_balance?: number | null
        }
        Update: {
          address?: string | null
          community?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          referral_code?: string | null
          updated_at?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_reward: number | null
          referrer_id: string
          referrer_reward: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_reward?: number | null
          referrer_id: string
          referrer_reward?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_reward?: number | null
          referrer_id?: string
          referrer_reward?: number | null
          status?: string
        }
        Relationships: []
      }
      staff_centers: {
        Row: {
          created_at: string
          pickup_center_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          pickup_center_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          pickup_center_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_centers_pickup_center_id_fkey"
            columns: ["pickup_center_id"]
            isOneToOne: false
            referencedRelation: "chicken_pickup_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          community: string | null
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          pincode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city?: string
          community?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone: string
          pincode: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          community?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          pincode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
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
      app_role: "admin" | "user" | "merchant" | "chicken_staff"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user", "merchant", "chicken_staff"],
    },
  },
} as const

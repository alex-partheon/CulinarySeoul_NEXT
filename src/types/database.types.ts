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
      audit_logs: {
        Row: {
          id: string
          table_name: string
          action: string
          row_id: string
          old_values: Json | null
          new_values: Json | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["erp_role"] | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          table_name: string
          action: string
          row_id: string
          old_values?: Json | null
          new_values?: Json | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["erp_role"] | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          table_name?: string
          action?: string
          row_id?: string
          old_values?: Json | null
          new_values?: Json | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["erp_role"] | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      brands: {
        Row: {
          id: string
          company_id: string
          name: string
          code: string
          domain: string | null
          description: string | null
          logo_url: string | null
          brand_colors: Json | null
          contact_info: Json | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          code: string
          domain?: string | null
          description?: string | null
          logo_url?: string | null
          brand_colors?: Json | null
          contact_info?: Json | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          code?: string
          domain?: string | null
          description?: string | null
          logo_url?: string | null
          brand_colors?: Json | null
          contact_info?: Json | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          code: string
          domain: string
          description: string | null
          address: Json | null
          phone: string | null
          email: string | null
          business_registration: string | null
          representative_name: string | null
          established_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          domain: string
          description?: string | null
          address?: Json | null
          phone?: string | null
          email?: string | null
          business_registration?: string | null
          representative_name?: string | null
          established_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          domain?: string
          description?: string | null
          address?: Json | null
          phone?: string | null
          email?: string | null
          business_registration?: string | null
          representative_name?: string | null
          established_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_batches: {
        Row: {
          id: string
          inventory_item_id: string
          store_id: string
          batch_number: string
          received_date: string
          expiry_date: string | null
          initial_quantity: number
          current_quantity: number
          unit_cost: number
          supplier_name: string | null
          purchase_order_number: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          inventory_item_id: string
          store_id: string
          batch_number: string
          received_date: string
          expiry_date?: string | null
          initial_quantity: number
          current_quantity: number
          unit_cost: number
          supplier_name?: string | null
          purchase_order_number?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          inventory_item_id?: string
          store_id?: string
          batch_number?: string
          received_date?: string
          expiry_date?: string | null
          initial_quantity?: number
          current_quantity?: number
          unit_cost?: number
          supplier_name?: string | null
          purchase_order_number?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_items: {
        Row: {
          id: string
          brand_id: string
          name: string
          code: string
          category: string | null
          unit: string
          minimum_stock: number
          maximum_stock: number | null
          standard_cost: number | null
          last_cost: number | null
          supplier_info: Json | null
          shelf_life_days: number | null
          storage_conditions: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          code: string
          category?: string | null
          unit: string
          minimum_stock?: number
          maximum_stock?: number | null
          standard_cost?: number | null
          last_cost?: number | null
          supplier_info?: Json | null
          shelf_life_days?: number | null
          storage_conditions?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          code?: string
          category?: string | null
          unit?: string
          minimum_stock?: number
          maximum_stock?: number | null
          standard_cost?: number | null
          last_cost?: number | null
          supplier_info?: Json | null
          shelf_life_days?: number | null
          storage_conditions?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_transactions: {
        Row: {
          id: string
          store_id: string
          inventory_item_id: string
          batch_id: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          performed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          inventory_item_id: string
          batch_id?: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          performed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          inventory_item_id?: string
          batch_id?: string | null
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity?: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          performed_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_categories: {
        Row: {
          id: string
          brand_id: string
          name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_items: {
        Row: {
          id: string
          brand_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          cost: number | null
          image_url: string | null
          display_order: number
          is_available: boolean
          is_popular: boolean
          is_new: boolean
          nutrition_info: Json | null
          allergen_info: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          cost?: number | null
          image_url?: string | null
          display_order?: number
          is_available?: boolean
          is_popular?: boolean
          is_new?: boolean
          nutrition_info?: Json | null
          allergen_info?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          cost?: number | null
          image_url?: string | null
          display_order?: number
          is_available?: boolean
          is_popular?: boolean
          is_new?: boolean
          nutrition_info?: Json | null
          allergen_info?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          recipe_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          customizations: Json | null
          unit_cost: number | null
          total_cost: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          recipe_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          customizations?: Json | null
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          recipe_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          customizations?: Json | null
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          store_id: string
          order_number: string
          customer_name: string | null
          customer_phone: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          status: Database["public"]["Enums"]["order_status"]
          order_type: string
          ordered_at: string | null
          estimated_ready_at: string | null
          completed_at: string | null
          notes: string | null
          special_requests: string | null
          taken_by: string | null
          prepared_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          order_number: string
          customer_name?: string | null
          customer_phone?: string | null
          subtotal: number
          tax_amount?: number
          discount_amount?: number
          total_amount: number
          status?: Database["public"]["Enums"]["order_status"]
          order_type?: string
          ordered_at?: string | null
          estimated_ready_at?: string | null
          completed_at?: string | null
          notes?: string | null
          special_requests?: string | null
          taken_by?: string | null
          prepared_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          order_number?: string
          customer_name?: string | null
          customer_phone?: string | null
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          order_type?: string
          ordered_at?: string | null
          estimated_ready_at?: string | null
          completed_at?: string | null
          notes?: string | null
          special_requests?: string | null
          taken_by?: string | null
          prepared_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          amount: number
          payment_method: string
          status: Database["public"]["Enums"]["payment_status"]
          refund_amount: number
          refund_reason: string | null
          refunded_at: string | null
          processed_at: string | null
          processed_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          amount: number
          payment_method: string
          status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          amount?: number
          payment_method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: Database["public"]["Enums"]["erp_role"]
          company_id: string | null
          brand_id: string | null
          store_id: string | null
          additional_permissions: Json
          is_active: boolean
          last_login_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["erp_role"]
          company_id?: string | null
          brand_id?: string | null
          store_id?: string | null
          additional_permissions?: Json
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["erp_role"]
          company_id?: string | null
          brand_id?: string | null
          store_id?: string | null
          additional_permissions?: Json
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          inventory_item_id: string
          quantity: number
          unit: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          inventory_item_id: string
          quantity: number
          unit: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          recipe_id?: string
          inventory_item_id?: string
          quantity?: number
          unit?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      recipes: {
        Row: {
          id: string
          menu_item_id: string
          version: number
          instructions: Json
          prep_time: number | null
          cook_time: number | null
          serving_size: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          menu_item_id: string
          version?: number
          instructions: Json
          prep_time?: number | null
          cook_time?: number | null
          serving_size?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          menu_item_id?: string
          version?: number
          instructions?: Json
          prep_time?: number | null
          cook_time?: number | null
          serving_size?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
      stores: {
        Row: {
          id: string
          brand_id: string
          name: string
          code: string
          type: string
          address: Json
          coordinates: unknown | null
          floor_info: string | null
          phone: string | null
          opening_hours: Json | null
          capacity: number | null
          area_sqm: number | null
          is_active: boolean
          opening_date: string | null
          closing_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          code: string
          type?: string
          address: Json
          coordinates?: unknown | null
          floor_info?: string | null
          phone?: string | null
          opening_hours?: Json | null
          capacity?: number | null
          area_sqm?: number | null
          is_active?: boolean
          opening_date?: string | null
          closing_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          code?: string
          type?: string
          address?: Json
          coordinates?: unknown | null
          floor_info?: string | null
          phone?: string | null
          opening_hours?: Json | null
          capacity?: number | null
          area_sqm?: number | null
          is_active?: boolean
          opening_date?: string | null
          closing_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_inventory_fifo: {
        Args: {
          p_store_id: string
          p_inventory_item_id: string
          p_quantity: number
          p_reference_type?: string
          p_reference_id?: string
          p_performed_by?: string
        }
        Returns: {
          total_cost: number
          batches_used: Json
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          role: Database["public"]["Enums"]["erp_role"]
          company_id: string
          brand_id: string
          store_id: string
          is_active: boolean
        }[]
      }
      user_has_brand_access: {
        Args: {
          target_brand_id: string
        }
        Returns: boolean
      }
      user_has_company_access: {
        Args: {
          target_company_id: string
        }
        Returns: boolean
      }
      user_has_store_access: {
        Args: {
          target_store_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      erp_role: "super_admin" | "company_admin" | "brand_admin" | "brand_staff" | "store_manager" | "store_staff"
      inventory_transaction_type: "inbound" | "outbound" | "adjustment" | "transfer" | "waste" | "promotion"
      order_status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
      payment_status: "pending" | "completed" | "failed" | "refunded" | "partially_refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

type DefaultSchema = DatabaseWithoutInternals["public"]

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

// CulinarySeoul ERP 특화 타입 추가
export type ERPRole = Database["public"]["Enums"]["erp_role"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type InventoryTransactionType = Database["public"]["Enums"]["inventory_transaction_type"]

// 주요 엔티티 타입 별칭
export type Company = Tables<"companies">
export type Brand = Tables<"brands">
export type Store = Tables<"stores">
export type Profile = Tables<"profiles">
export type MenuItem = Tables<"menu_items">
export type Order = Tables<"orders">
export type OrderItem = Tables<"order_items">
export type Payment = Tables<"payments">
export type InventoryItem = Tables<"inventory_items">
export type InventoryBatch = Tables<"inventory_batches">
export type Recipe = Tables<"recipes">
export type AuditLog = Tables<"audit_logs">

// Insert 타입 별칭
export type CompanyInsert = TablesInsert<"companies">
export type BrandInsert = TablesInsert<"brands">
export type StoreInsert = TablesInsert<"stores">
export type ProfileInsert = TablesInsert<"profiles">
export type MenuItemInsert = TablesInsert<"menu_items">
export type OrderInsert = TablesInsert<"orders">
export type OrderItemInsert = TablesInsert<"order_items">

// Constants export
export const Constants = {
  public: {
    Enums: {
      erp_role: ["super_admin", "company_admin", "brand_admin", "brand_staff", "store_manager", "store_staff"] as const,
      order_status: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const,
      payment_status: ["pending", "completed", "failed", "refunded", "partially_refunded"] as const,
      inventory_transaction_type: ["inbound", "outbound", "adjustment", "transfer", "waste", "promotion"] as const,
    },
  },
} as const
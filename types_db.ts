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
      activity_open_times: {
        Row: {
          activity_type: string | null
          discount: string | null
          id: number
          time: string | null
        }
        Insert: {
          activity_type?: string | null
          discount?: string | null
          id?: number
          time?: string | null
        }
        Update: {
          activity_type?: string | null
          discount?: string | null
          id?: number
          time?: string | null
        }
        Relationships: []
      }
      booking: {
        Row: {
          booked_by: string
          booking_timestamp: string | null
          created_at: string
          date_time: string | null
          group_name: string | null
          id: string
          is_paid: boolean | null
          is_quote: boolean | null
          location: string | null
          num_of_ppl: number | null
        }
        Insert: {
          booked_by: string
          booking_timestamp?: string | null
          created_at?: string
          date_time?: string | null
          group_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_quote?: boolean | null
          location?: string | null
          num_of_ppl?: number | null
        }
        Update: {
          booked_by?: string
          booking_timestamp?: string | null
          created_at?: string
          date_time?: string | null
          group_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_quote?: boolean | null
          location?: string | null
          num_of_ppl?: number | null
        }
        Relationships: []
      }
      booking_customer: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_customer_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_customer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      breaks: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          duration: number | null
          entry_id: string | null
          id: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          duration?: number | null
          entry_id?: string | null
          id?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          duration?: number | null
          entry_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breaks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      clock_in: {
        Row: {
          clock_in_time: string | null
          created_at: string
          id: string
          image: string | null
          lat: number | null
          long: number | null
        }
        Insert: {
          clock_in_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          lat?: number | null
          long?: number | null
        }
        Update: {
          clock_in_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          lat?: number | null
          long?: number | null
        }
        Relationships: []
      }
      clock_out: {
        Row: {
          clock_out_time: string | null
          created_at: string
          id: string
          image: string | null
          lat: number | null
          long: number | null
        }
        Insert: {
          clock_out_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          lat?: number | null
          long?: number | null
        }
        Update: {
          clock_out_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          lat?: number | null
          long?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      group_vehicles: {
        Row: {
          group_id: string
          id: string
          old_booking_id: number | null
          old_vehicle_name: string | null
          quantity: number
        }
        Insert: {
          group_id: string
          id?: string
          old_booking_id?: number | null
          old_vehicle_name?: string | null
          quantity: number
        }
        Update: {
          group_id?: string
          id?: string
          old_booking_id?: number | null
          old_vehicle_name?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_vehicles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string
          group_date: string
          group_name: string
          id: string
          launched: string | null
          lead: string | null
          sweep: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          group_date: string
          group_name: string
          id?: string
          launched?: string | null
          lead?: string | null
          sweep?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          group_date?: string
          group_name?: string
          id?: string
          launched?: string | null
          lead?: string | null
          sweep?: string | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          activity: string | null
          arena: string | null
          attraction: string | null
          casino: string | null
          club: string | null
          Contact_Person: string | null
          content: string | null
          eventplanners: string | null
          facebook: string | null
          future0: string | null
          golf: string | null
          googleplus: string | null
          hall: string | null
          hotel: string | null
          Hotel_Address: string | null
          Hotel_ID: number | null
          Hotel_Name: string | null
          Hotel_Phone: string | null
          image: string | null
          kids: string | null
          map_image: string | null
          mastervenue: string | null
          notes: string | null
          partner: string | null
          Pickup_Location: string | null
          previous: string | null
          restaurant: string | null
          sbpickup: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          theater: string | null
          tshare: string | null
          twitter: string | null
          uri_name: string | null
          venue: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          activity?: string | null
          arena?: string | null
          attraction?: string | null
          casino?: string | null
          club?: string | null
          Contact_Person?: string | null
          content?: string | null
          eventplanners?: string | null
          facebook?: string | null
          future0?: string | null
          golf?: string | null
          googleplus?: string | null
          hall?: string | null
          hotel?: string | null
          Hotel_Address?: string | null
          Hotel_ID?: number | null
          Hotel_Name?: string | null
          Hotel_Phone?: string | null
          image?: string | null
          kids?: string | null
          map_image?: string | null
          mastervenue?: string | null
          notes?: string | null
          partner?: string | null
          Pickup_Location?: string | null
          previous?: string | null
          restaurant?: string | null
          sbpickup?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          theater?: string | null
          tshare?: string | null
          twitter?: string | null
          uri_name?: string | null
          venue?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          activity?: string | null
          arena?: string | null
          attraction?: string | null
          casino?: string | null
          club?: string | null
          Contact_Person?: string | null
          content?: string | null
          eventplanners?: string | null
          facebook?: string | null
          future0?: string | null
          golf?: string | null
          googleplus?: string | null
          hall?: string | null
          hotel?: string | null
          Hotel_Address?: string | null
          Hotel_ID?: number | null
          Hotel_Name?: string | null
          Hotel_Phone?: string | null
          image?: string | null
          kids?: string | null
          map_image?: string | null
          mastervenue?: string | null
          notes?: string | null
          partner?: string | null
          Pickup_Location?: string | null
          previous?: string | null
          restaurant?: string | null
          sbpickup?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          theater?: string | null
          tshare?: string | null
          twitter?: string | null
          uri_name?: string | null
          venue?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      qr_history: {
        Row: {
          id: number
          link: string | null
          user: string | null
        }
        Insert: {
          id?: number
          link?: string | null
          user?: string | null
        }
        Update: {
          id?: number
          link?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_history_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shuttle_assignment: {
        Row: {
          created_at: string
          id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shuttle_assignment_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in_id: string | null
          clock_out_id: string | null
          date: string | null
          duration: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          clock_in_id?: string | null
          clock_out_id?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          clock_in_id?: string | null
          clock_out_id?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_clock_in_id_fkey"
            columns: ["clock_in_id"]
            isOneToOne: false
            referencedRelation: "clock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_clock_out_id_fkey"
            columns: ["clock_out_id"]
            isOneToOne: false
            referencedRelation: "clock_out"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_sheet_requests: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          reason: string | null
          start_time: string
          status: Database["public"]["Enums"]["request_progress"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["request_progress"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["request_progress"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_sheet_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_department: {
        Row: {
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          department_id?: string
          id?: string
          user_id?: string
        }
        Update: {
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_department_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_department_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          time_entry_status:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level: number | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level?: number | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          id: string
          make: string
          model: string
          name: string
          profile_pic_bucket: string | null
          profile_pic_key: string | null
          seats: number
          type: Database["public"]["Enums"]["vehicle_type"]
          year: number
        }
        Insert: {
          id?: string
          make?: string
          model?: string
          name: string
          profile_pic_bucket?: string | null
          profile_pic_key?: string | null
          seats?: number
          type: Database["public"]["Enums"]["vehicle_type"]
          year?: number
        }
        Update: {
          id?: string
          make?: string
          model?: string
          name?: string
          profile_pic_bucket?: string | null
          profile_pic_key?: string | null
          seats?: number
          type?: Database["public"]["Enums"]["vehicle_type"]
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_clock_out: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clock_in_user: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      clock_out_user: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      is_high_level_user: {
        Args: {
          uid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      request_progress: "rejected" | "pending" | "accepted"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      time_entry_status: "clocked_in" | "clocked_out" | "on_break"
      user_type: "employee" | "customer" | "partner"
      vehicle_type:
        | "shuttle"
        | "buggy"
        | "atv"
        | "utv"
        | "sedan"
        | "truck"
        | "trailer"
        | "tram"
        | "forktruck"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

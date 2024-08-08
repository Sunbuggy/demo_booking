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
      booking_details: {
        Row: {
          booking_amount: number
          booking_date: string
          booking_id: string | null
          booking_type: string
          id: string
        }
        Insert: {
          booking_amount: number
          booking_date: string
          booking_id?: string | null
          booking_type: string
          id?: string
        }
        Update: {
          booking_amount?: number
          booking_date?: string
          booking_id?: string | null
          booking_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookingdetails_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_vehicles: {
        Row: {
          booking_id: string | null
          id: string
          quantity: number
          vehicle_id: string | null
        }
        Insert: {
          booking_id?: string | null
          id?: string
          quantity: number
          vehicle_id?: string | null
        }
        Update: {
          booking_id?: string | null
          id?: string
          quantity?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookingvehicles_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookingvehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_details: string | null
          created_by: string
          created_date: string
          id: string
          status: string
          updated_by: string
        }
        Insert: {
          booking_details?: string | null
          created_by: string
          created_date?: string
          id?: string
          status: string
          updated_by: string
        }
        Update: {
          booking_details?: string | null
          created_by?: string
          created_date?: string
          id?: string
          status?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_booking_details_fkey"
            columns: ["booking_details"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
        ]
      }
      breaks: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          date: string | null
          duration: number | null
          entry_id: string | null
          id: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          date?: string | null
          duration?: number | null
          entry_id?: string | null
          id?: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          date?: string | null
          duration?: number | null
          entry_id?: string | null
          id?: number
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
      customers: {
        Row: {
          address: string
          email: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          address: string
          email: string
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          address?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
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
          booking_id: string | null
          group_id: string
          id: string
          old_booking_id: number | null
          old_vehicle_name: string | null
          quantity: number
          vehicle_id: string | null
        }
        Insert: {
          booking_id?: string | null
          group_id: string
          id?: string
          old_booking_id?: number | null
          old_vehicle_name?: string | null
          quantity: number
          vehicle_id?: string | null
        }
        Update: {
          booking_id?: string | null
          group_id?: string
          id?: string
          old_booking_id?: number | null
          old_vehicle_name?: string | null
          quantity?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_vehicles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupvehicles_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupvehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      time_entries: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          date: string | null
          duration: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          date?: string | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_user_id_fkey"
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
          full_name: string | null
          id: string
          time_entry_status:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level: number | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level?: number | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
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
          description: string | null
          id: string
          name: string
          status: string
          type: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          status: string
          type: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      time_entry_status: "CLOCKED_IN" | "CLOCKED_OUT" | "ON_BREAK"
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

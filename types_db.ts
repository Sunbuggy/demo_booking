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
      adventures: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          imageUrl: string | null
          title: string | null
          videoUrl: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          title?: string | null
          videoUrl?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          title?: string | null
          videoUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adventures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
      dispatch_groups: {
        Row: {
          id: string
          location: Database["public"]["Enums"]["dispatch_locations"] | null
          user: string | null
        }
        Insert: {
          id?: string
          location?: Database["public"]["Enums"]["dispatch_locations"] | null
          user?: string | null
        }
        Update: {
          id?: string
          location?: Database["public"]["Enums"]["dispatch_locations"] | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch groups_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_details: {
        Row: {
          emp_id: string | null
          id: string
          payroll_company: string | null
          primary_position: string | null
          primary_work_location: string | null
          user_id: string | null
        }
        Insert: {
          emp_id?: string | null
          id?: string
          payroll_company?: string | null
          primary_position?: string | null
          primary_work_location?: string | null
          user_id?: string | null
        }
        Update: {
          emp_id?: string | null
          id?: string
          payroll_company?: string | null
          primary_position?: string | null
          primary_work_location?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          scanned_at: string | null
          user: string | null
          vehicle_id: string | null
        }
        Insert: {
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          scanned_at?: string | null
          user?: string | null
          vehicle_id?: string | null
        }
        Update: {
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          scanned_at?: string | null
          user?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      shuttle_assignment: {
        Row: {
          created_at: string
          created_by: string
          date_assigned_for: string | null
          employee_id: string
          id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date_assigned_for?: string | null
          employee_id: string
          id?: string
          vehicle_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date_assigned_for?: string | null
          employee_id?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shuttle_assignment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shuttle_assignment_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          bg_image: string | null
          bg_position: string | null
          bg_repeat: string | null
          bg_size: string | null
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
          bg_image?: string | null
          bg_position?: string | null
          bg_repeat?: string | null
          bg_size?: string | null
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
          bg_image?: string | null
          bg_position?: string | null
          bg_repeat?: string | null
          bg_size?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          user_level?: number | null
        }
        Relationships: []
      }
      vehicle_future_location: {
        Row: {
          created_at: string | null
          created_by: string | null
          future_date: string | null
          future_location: string | null
          id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          future_date?: string | null
          future_location?: string | null
          id?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          future_date?: string | null
          future_location?: string | null
          id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_future_location_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_future_location_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inventory_location: {
        Row: {
          bay: string | null
          created_at: string
          created_by: string | null
          id: string
          level: string | null
          vehicle_id: string | null
        }
        Insert: {
          bay?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string | null
          vehicle_id?: string | null
        }
        Update: {
          bay?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inventory_location_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inventory_location_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_locations: {
        Row: {
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          dispatch_close_notes: string | null
          dispatch_notes: string | null
          dispatch_status: Database["public"]["Enums"]["dispatch_status"] | null
          dispatched_at: string | null
          dispatched_by: string | null
          distress_ticket_number: number | null
          id: string
          is_distress_signal: boolean
          latitude: number | null
          longitude: number | null
          vehicle_id: string | null
        }
        Insert: {
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at: string
          created_by?: string | null
          dispatch_close_notes?: string | null
          dispatch_notes?: string | null
          dispatch_status?:
            | Database["public"]["Enums"]["dispatch_status"]
            | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          distress_ticket_number?: number | null
          id?: string
          is_distress_signal?: boolean
          latitude?: number | null
          longitude?: number | null
          vehicle_id?: string | null
        }
        Update: {
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          dispatch_close_notes?: string | null
          dispatch_notes?: string | null
          dispatch_status?:
            | Database["public"]["Enums"]["dispatch_status"]
            | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          distress_ticket_number?: number | null
          id?: string
          is_distress_signal?: boolean
          latitude?: number | null
          longitude?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_dispatched_by_fkey"
            columns: ["dispatched_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pretrip_atv: {
        Row: {
          axle_nuts_intact: boolean | null
          brakes_front_intact: boolean | null
          brakes_rear_intact: boolean | null
          ca_reg_valid: boolean | null
          ca_sticker: boolean | null
          chain_intact: boolean | null
          created_at: string | null
          created_by: string
          gas_level: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          good_oil_level: boolean | null
          id: string
          lug_nuts_intact: boolean | null
          notes: string | null
          nv_reg_valid: boolean | null
          nv_sticker: boolean | null
          tire_left_intact: boolean | null
          tire_right_intact: boolean | null
          vehicle_id: string | null
        }
        Insert: {
          axle_nuts_intact?: boolean | null
          brakes_front_intact?: boolean | null
          brakes_rear_intact?: boolean | null
          ca_reg_valid?: boolean | null
          ca_sticker?: boolean | null
          chain_intact?: boolean | null
          created_at?: string | null
          created_by: string
          gas_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          good_oil_level?: boolean | null
          id?: string
          lug_nuts_intact?: boolean | null
          notes?: string | null
          nv_reg_valid?: boolean | null
          nv_sticker?: boolean | null
          tire_left_intact?: boolean | null
          tire_right_intact?: boolean | null
          vehicle_id?: string | null
        }
        Update: {
          axle_nuts_intact?: boolean | null
          brakes_front_intact?: boolean | null
          brakes_rear_intact?: boolean | null
          ca_reg_valid?: boolean | null
          ca_sticker?: boolean | null
          chain_intact?: boolean | null
          created_at?: string | null
          created_by?: string
          gas_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          good_oil_level?: boolean | null
          id?: string
          lug_nuts_intact?: boolean | null
          notes?: string | null
          nv_reg_valid?: boolean | null
          nv_sticker?: boolean | null
          tire_left_intact?: boolean | null
          tire_right_intact?: boolean | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temp_atv_pretrip_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temp_atv_pretrip_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pretrip_buggy: {
        Row: {
          axle_sleeves_intact: boolean | null
          ball_joints_intact: boolean | null
          brake_pads_intact: boolean | null
          brakes_calliper_intact: boolean | null
          brakes_intact: boolean | null
          brakes_stop: boolean | null
          buggy_washed: boolean | null
          clean_of_trash: boolean | null
          created_at: string
          created_by: string | null
          drive_belt_intact: boolean | null
          drive_test_pass: boolean | null
          frame_intact: boolean | null
          front_bumper_intact: boolean | null
          fuel_filters_clean: boolean | null
          good_lug_nuts: boolean | null
          good_oil_level: boolean | null
          hyme_joints_tight: boolean | null
          id: string
          notes: string | null
          passes_light_bar_test: boolean | null
          passes_recovery_hitch_test: boolean | null
          performance_drive: boolean | null
          rear_bumper_black: boolean | null
          rear_bumper_paint: boolean | null
          recovery_hitch_intact: boolean | null
          reg_ca_valid: boolean | null
          reg_nv_valid: boolean | null
          rims_intact: boolean | null
          seat_belts_all_in_place: boolean | null
          seat_belts_all_work_properly: boolean | null
          shocks_intact: boolean | null
          side_panes_intact: boolean | null
          steering_intact: boolean | null
          steering_left: boolean | null
          steering_right: boolean | null
          steering_wheel_padded: boolean | null
          suspension_jam_nuts_intact: boolean | null
          suspension_quick_check: boolean | null
          throttle_intact: boolean | null
          throttle_springs_intact: boolean | null
          tire_pressure_front: boolean | null
          tire_pressure_rear: boolean | null
          vehicle_id: string
          wires_condition_intact: boolean | null
          wires_in_place: boolean | null
        }
        Insert: {
          axle_sleeves_intact?: boolean | null
          ball_joints_intact?: boolean | null
          brake_pads_intact?: boolean | null
          brakes_calliper_intact?: boolean | null
          brakes_intact?: boolean | null
          brakes_stop?: boolean | null
          buggy_washed?: boolean | null
          clean_of_trash?: boolean | null
          created_at?: string
          created_by?: string | null
          drive_belt_intact?: boolean | null
          drive_test_pass?: boolean | null
          frame_intact?: boolean | null
          front_bumper_intact?: boolean | null
          fuel_filters_clean?: boolean | null
          good_lug_nuts?: boolean | null
          good_oil_level?: boolean | null
          hyme_joints_tight?: boolean | null
          id?: string
          notes?: string | null
          passes_light_bar_test?: boolean | null
          passes_recovery_hitch_test?: boolean | null
          performance_drive?: boolean | null
          rear_bumper_black?: boolean | null
          rear_bumper_paint?: boolean | null
          recovery_hitch_intact?: boolean | null
          reg_ca_valid?: boolean | null
          reg_nv_valid?: boolean | null
          rims_intact?: boolean | null
          seat_belts_all_in_place?: boolean | null
          seat_belts_all_work_properly?: boolean | null
          shocks_intact?: boolean | null
          side_panes_intact?: boolean | null
          steering_intact?: boolean | null
          steering_left?: boolean | null
          steering_right?: boolean | null
          steering_wheel_padded?: boolean | null
          suspension_jam_nuts_intact?: boolean | null
          suspension_quick_check?: boolean | null
          throttle_intact?: boolean | null
          throttle_springs_intact?: boolean | null
          tire_pressure_front?: boolean | null
          tire_pressure_rear?: boolean | null
          vehicle_id: string
          wires_condition_intact?: boolean | null
          wires_in_place?: boolean | null
        }
        Update: {
          axle_sleeves_intact?: boolean | null
          ball_joints_intact?: boolean | null
          brake_pads_intact?: boolean | null
          brakes_calliper_intact?: boolean | null
          brakes_intact?: boolean | null
          brakes_stop?: boolean | null
          buggy_washed?: boolean | null
          clean_of_trash?: boolean | null
          created_at?: string
          created_by?: string | null
          drive_belt_intact?: boolean | null
          drive_test_pass?: boolean | null
          frame_intact?: boolean | null
          front_bumper_intact?: boolean | null
          fuel_filters_clean?: boolean | null
          good_lug_nuts?: boolean | null
          good_oil_level?: boolean | null
          hyme_joints_tight?: boolean | null
          id?: string
          notes?: string | null
          passes_light_bar_test?: boolean | null
          passes_recovery_hitch_test?: boolean | null
          performance_drive?: boolean | null
          rear_bumper_black?: boolean | null
          rear_bumper_paint?: boolean | null
          recovery_hitch_intact?: boolean | null
          reg_ca_valid?: boolean | null
          reg_nv_valid?: boolean | null
          rims_intact?: boolean | null
          seat_belts_all_in_place?: boolean | null
          seat_belts_all_work_properly?: boolean | null
          shocks_intact?: boolean | null
          side_panes_intact?: boolean | null
          steering_intact?: boolean | null
          steering_left?: boolean | null
          steering_right?: boolean | null
          steering_wheel_padded?: boolean | null
          suspension_jam_nuts_intact?: boolean | null
          suspension_quick_check?: boolean | null
          throttle_intact?: boolean | null
          throttle_springs_intact?: boolean | null
          tire_pressure_front?: boolean | null
          tire_pressure_rear?: boolean | null
          vehicle_id?: string
          wires_condition_intact?: boolean | null
          wires_in_place?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "temp_buggy_pretrip_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_pretrip_buggy_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pretrip_forklift: {
        Row: {
          back_up_alarm_operational: boolean | null
          battery_intact: boolean | null
          controls_and_levers_work: boolean | null
          created_at: string | null
          created_by: string | null
          electrical_lines_intact: boolean | null
          emergency_stop_and_brakes_work: boolean | null
          extension_cylinders_intact: boolean | null
          foot_controls_work: boolean | null
          fuel_gas_level:
            | Database["public"]["Enums"]["vehicle_fuel_level"]
            | null
          id: string
          motor_condition_intact: boolean | null
          no_broken_or_loose_part: boolean | null
          no_hydraulic_fluid_leaks: boolean | null
          notes: string | null
          oil_level_correct: boolean | null
          pivot_pins_intact: boolean | null
          seat_belts_intact: boolean | null
          tires_good_shape: boolean | null
          vehicle_id: string
          vert_mast_sliding_chains_parts_operational: boolean | null
          window_clean: boolean | null
        }
        Insert: {
          back_up_alarm_operational?: boolean | null
          battery_intact?: boolean | null
          controls_and_levers_work?: boolean | null
          created_at?: string | null
          created_by?: string | null
          electrical_lines_intact?: boolean | null
          emergency_stop_and_brakes_work?: boolean | null
          extension_cylinders_intact?: boolean | null
          foot_controls_work?: boolean | null
          fuel_gas_level?:
            | Database["public"]["Enums"]["vehicle_fuel_level"]
            | null
          id?: string
          motor_condition_intact?: boolean | null
          no_broken_or_loose_part?: boolean | null
          no_hydraulic_fluid_leaks?: boolean | null
          notes?: string | null
          oil_level_correct?: boolean | null
          pivot_pins_intact?: boolean | null
          seat_belts_intact?: boolean | null
          tires_good_shape?: boolean | null
          vehicle_id: string
          vert_mast_sliding_chains_parts_operational?: boolean | null
          window_clean?: boolean | null
        }
        Update: {
          back_up_alarm_operational?: boolean | null
          battery_intact?: boolean | null
          controls_and_levers_work?: boolean | null
          created_at?: string | null
          created_by?: string | null
          electrical_lines_intact?: boolean | null
          emergency_stop_and_brakes_work?: boolean | null
          extension_cylinders_intact?: boolean | null
          foot_controls_work?: boolean | null
          fuel_gas_level?:
            | Database["public"]["Enums"]["vehicle_fuel_level"]
            | null
          id?: string
          motor_condition_intact?: boolean | null
          no_broken_or_loose_part?: boolean | null
          no_hydraulic_fluid_leaks?: boolean | null
          notes?: string | null
          oil_level_correct?: boolean | null
          pivot_pins_intact?: boolean | null
          seat_belts_intact?: boolean | null
          tires_good_shape?: boolean | null
          vehicle_id?: string
          vert_mast_sliding_chains_parts_operational?: boolean | null
          window_clean?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_pretrip_forklift_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pretrip_shuttle: {
        Row: {
          ac_working: boolean | null
          all_light_bulbs_intact: boolean | null
          all_tire_pressure_within_5_psi_of_spec: boolean | null
          annual_inspection_all_shuttles: boolean | null
          antifreeze_level_proper_level: boolean | null
          battery_working: boolean | null
          body_damage: string | null
          brake_fluid_level: boolean | null
          buggy_on_roof_secured: boolean | null
          created_at: string
          created_by: string | null
          engine_belts_intact: boolean | null
          fire_extinguisher_present: boolean | null
          first_aid_kit_mounted: boolean | null
          first_aid_kit_stocked: boolean | null
          fuel_level: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          heater_working: boolean | null
          ice_chest_in_shuttle: boolean | null
          id: string
          insurance_valid: boolean | null
          is_check_engine_on: boolean | null
          is_horn_working: boolean | null
          is_vehicle_clean: boolean | null
          light_indicators_work: boolean | null
          milage: string | null
          mirror_working: boolean | null
          notes: string | null
          oil_proper_level: boolean | null
          power_steering_fluid_proper_level: boolean | null
          registration_valid: boolean | null
          seat_belts_intact: boolean | null
          shuttles_plugged_in_winter: boolean | null
          triangles_present: boolean | null
          vehicle_id: string | null
          visible_hoses_intact: boolean | null
          visible_leaks: boolean | null
          wind_shield_washer_fluid_full: boolean | null
        }
        Insert: {
          ac_working?: boolean | null
          all_light_bulbs_intact?: boolean | null
          all_tire_pressure_within_5_psi_of_spec?: boolean | null
          annual_inspection_all_shuttles?: boolean | null
          antifreeze_level_proper_level?: boolean | null
          battery_working?: boolean | null
          body_damage?: string | null
          brake_fluid_level?: boolean | null
          buggy_on_roof_secured?: boolean | null
          created_at: string
          created_by?: string | null
          engine_belts_intact?: boolean | null
          fire_extinguisher_present?: boolean | null
          first_aid_kit_mounted?: boolean | null
          first_aid_kit_stocked?: boolean | null
          fuel_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          heater_working?: boolean | null
          ice_chest_in_shuttle?: boolean | null
          id?: string
          insurance_valid?: boolean | null
          is_check_engine_on?: boolean | null
          is_horn_working?: boolean | null
          is_vehicle_clean?: boolean | null
          light_indicators_work?: boolean | null
          milage?: string | null
          mirror_working?: boolean | null
          notes?: string | null
          oil_proper_level?: boolean | null
          power_steering_fluid_proper_level?: boolean | null
          registration_valid?: boolean | null
          seat_belts_intact?: boolean | null
          shuttles_plugged_in_winter?: boolean | null
          triangles_present?: boolean | null
          vehicle_id?: string | null
          visible_hoses_intact?: boolean | null
          visible_leaks?: boolean | null
          wind_shield_washer_fluid_full?: boolean | null
        }
        Update: {
          ac_working?: boolean | null
          all_light_bulbs_intact?: boolean | null
          all_tire_pressure_within_5_psi_of_spec?: boolean | null
          annual_inspection_all_shuttles?: boolean | null
          antifreeze_level_proper_level?: boolean | null
          battery_working?: boolean | null
          body_damage?: string | null
          brake_fluid_level?: boolean | null
          buggy_on_roof_secured?: boolean | null
          created_at?: string
          created_by?: string | null
          engine_belts_intact?: boolean | null
          fire_extinguisher_present?: boolean | null
          first_aid_kit_mounted?: boolean | null
          first_aid_kit_stocked?: boolean | null
          fuel_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          heater_working?: boolean | null
          ice_chest_in_shuttle?: boolean | null
          id?: string
          insurance_valid?: boolean | null
          is_check_engine_on?: boolean | null
          is_horn_working?: boolean | null
          is_vehicle_clean?: boolean | null
          light_indicators_work?: boolean | null
          milage?: string | null
          mirror_working?: boolean | null
          notes?: string | null
          oil_proper_level?: boolean | null
          power_steering_fluid_proper_level?: boolean | null
          registration_valid?: boolean | null
          seat_belts_intact?: boolean | null
          shuttles_plugged_in_winter?: boolean | null
          triangles_present?: boolean | null
          vehicle_id?: string | null
          visible_hoses_intact?: boolean | null
          visible_leaks?: boolean | null
          wind_shield_washer_fluid_full?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_pretrip_shuttle_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_pretrip_shuttle_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pretrip_truck: {
        Row: {
          ac_working: boolean | null
          all_tire_pressure_within_5_psi_of_spec: boolean | null
          battery_in_working_condition: boolean | null
          blm_permit_present: boolean | null
          brake_fluid_full: boolean | null
          brakes_hold_in_good_condition: boolean | null
          brakes_in_good_condition: boolean | null
          buggy_on_roof_secured: boolean | null
          cabin_heater_working: boolean | null
          check_engine_light_off: boolean | null
          coolant_level_at_proper_level: boolean | null
          created_at: string | null
          created_by: string | null
          did_you_need_to_open_new_tag: boolean | null
          drive_shaft_exhaust_frame_good_condition: boolean | null
          emergency_brake_works: boolean | null
          engine_belts_not_cracked_or_frayed: boolean | null
          fire_extinguisher_present_and_mounted: boolean | null
          first_aid_kit_mounted_and_fully_stocked: boolean | null
          free_fluid_leaks: boolean | null
          fuel_cap_present: boolean | null
          fuel_card_present: boolean | null
          fuel_level: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          gas_tanks_strapped_on_securely: boolean | null
          horn_operational: boolean | null
          hoses_you_can_see_in_good_working_order: boolean | null
          id: string
          if_trailer_will_be_used_enter_no: boolean | null
          inspection_valid: boolean | null
          insurance_valid: boolean | null
          light_indicators_work: boolean | null
          lights_working: boolean | null
          mileage: number | null
          mirror_working: boolean | null
          no_body_damage: boolean | null
          no_flat_tire: boolean | null
          no_visible_leaks_of_any_fluids: boolean | null
          notes: string | null
          other_dash_light_on: boolean | null
          power_steering_fluid_at_proper_level: boolean | null
          proper_oil_level: boolean | null
          registration_valid: boolean | null
          rims_and_lugs_good_condition: boolean | null
          seat_belts_in_working_order: boolean | null
          seat_belts_working_not_frayed_or_worn: boolean | null
          springs_and_ubolts_in_proper_condition: boolean | null
          triangles_present: boolean | null
          vehicle_clean_or_dirty: boolean | null
          vehicle_id: string | null
          windshield_in_working_condition: boolean | null
          windshield_washer_fluid_full: boolean | null
          windshield_wipers_condition: boolean | null
        }
        Insert: {
          ac_working?: boolean | null
          all_tire_pressure_within_5_psi_of_spec?: boolean | null
          battery_in_working_condition?: boolean | null
          blm_permit_present?: boolean | null
          brake_fluid_full?: boolean | null
          brakes_hold_in_good_condition?: boolean | null
          brakes_in_good_condition?: boolean | null
          buggy_on_roof_secured?: boolean | null
          cabin_heater_working?: boolean | null
          check_engine_light_off?: boolean | null
          coolant_level_at_proper_level?: boolean | null
          created_at?: string | null
          created_by?: string | null
          did_you_need_to_open_new_tag?: boolean | null
          drive_shaft_exhaust_frame_good_condition?: boolean | null
          emergency_brake_works?: boolean | null
          engine_belts_not_cracked_or_frayed?: boolean | null
          fire_extinguisher_present_and_mounted?: boolean | null
          first_aid_kit_mounted_and_fully_stocked?: boolean | null
          free_fluid_leaks?: boolean | null
          fuel_cap_present?: boolean | null
          fuel_card_present?: boolean | null
          fuel_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          gas_tanks_strapped_on_securely?: boolean | null
          horn_operational?: boolean | null
          hoses_you_can_see_in_good_working_order?: boolean | null
          id?: string
          if_trailer_will_be_used_enter_no?: boolean | null
          inspection_valid?: boolean | null
          insurance_valid?: boolean | null
          light_indicators_work?: boolean | null
          lights_working?: boolean | null
          mileage?: number | null
          mirror_working?: boolean | null
          no_body_damage?: boolean | null
          no_flat_tire?: boolean | null
          no_visible_leaks_of_any_fluids?: boolean | null
          notes?: string | null
          other_dash_light_on?: boolean | null
          power_steering_fluid_at_proper_level?: boolean | null
          proper_oil_level?: boolean | null
          registration_valid?: boolean | null
          rims_and_lugs_good_condition?: boolean | null
          seat_belts_in_working_order?: boolean | null
          seat_belts_working_not_frayed_or_worn?: boolean | null
          springs_and_ubolts_in_proper_condition?: boolean | null
          triangles_present?: boolean | null
          vehicle_clean_or_dirty?: boolean | null
          vehicle_id?: string | null
          windshield_in_working_condition?: boolean | null
          windshield_washer_fluid_full?: boolean | null
          windshield_wipers_condition?: boolean | null
        }
        Update: {
          ac_working?: boolean | null
          all_tire_pressure_within_5_psi_of_spec?: boolean | null
          battery_in_working_condition?: boolean | null
          blm_permit_present?: boolean | null
          brake_fluid_full?: boolean | null
          brakes_hold_in_good_condition?: boolean | null
          brakes_in_good_condition?: boolean | null
          buggy_on_roof_secured?: boolean | null
          cabin_heater_working?: boolean | null
          check_engine_light_off?: boolean | null
          coolant_level_at_proper_level?: boolean | null
          created_at?: string | null
          created_by?: string | null
          did_you_need_to_open_new_tag?: boolean | null
          drive_shaft_exhaust_frame_good_condition?: boolean | null
          emergency_brake_works?: boolean | null
          engine_belts_not_cracked_or_frayed?: boolean | null
          fire_extinguisher_present_and_mounted?: boolean | null
          first_aid_kit_mounted_and_fully_stocked?: boolean | null
          free_fluid_leaks?: boolean | null
          fuel_cap_present?: boolean | null
          fuel_card_present?: boolean | null
          fuel_level?: Database["public"]["Enums"]["vehicle_fuel_level"] | null
          gas_tanks_strapped_on_securely?: boolean | null
          horn_operational?: boolean | null
          hoses_you_can_see_in_good_working_order?: boolean | null
          id?: string
          if_trailer_will_be_used_enter_no?: boolean | null
          inspection_valid?: boolean | null
          insurance_valid?: boolean | null
          light_indicators_work?: boolean | null
          lights_working?: boolean | null
          mileage?: number | null
          mirror_working?: boolean | null
          no_body_damage?: boolean | null
          no_flat_tire?: boolean | null
          no_visible_leaks_of_any_fluids?: boolean | null
          notes?: string | null
          other_dash_light_on?: boolean | null
          power_steering_fluid_at_proper_level?: boolean | null
          proper_oil_level?: boolean | null
          registration_valid?: boolean | null
          rims_and_lugs_good_condition?: boolean | null
          seat_belts_in_working_order?: boolean | null
          seat_belts_working_not_frayed_or_worn?: boolean | null
          springs_and_ubolts_in_proper_condition?: boolean | null
          triangles_present?: boolean | null
          vehicle_clean_or_dirty?: boolean | null
          vehicle_id?: string | null
          windshield_in_working_condition?: boolean | null
          windshield_washer_fluid_full?: boolean | null
          windshield_wipers_condition?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_pretrip_truck_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_pretrip_truck_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_tag: {
        Row: {
          close_tag_comment: string | null
          created_at: string | null
          created_by: string | null
          created_by_legacy: string | null
          id: string
          notes: string | null
          tag_status: Database["public"]["Enums"]["tag_status"]
          tag_type: Database["public"]["Enums"]["vehicle_tag_type"] | null
          updated_at: string | null
          updated_by: string | null
          updated_by_legacy: string | null
          vehicle_id: string | null
        }
        Insert: {
          close_tag_comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_legacy?: string | null
          id?: string
          notes?: string | null
          tag_status?: Database["public"]["Enums"]["tag_status"]
          tag_type?: Database["public"]["Enums"]["vehicle_tag_type"] | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_legacy?: string | null
          vehicle_id?: string | null
        }
        Update: {
          close_tag_comment?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_legacy?: string | null
          id?: string
          notes?: string | null
          tag_status?: Database["public"]["Enums"]["tag_status"]
          tag_type?: Database["public"]["Enums"]["vehicle_tag_type"] | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_legacy?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_tag_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_tag_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          id: string
          licenseplate: string | null
          make: string
          model: string
          name: string
          notes: string | null
          pet_name: string | null
          profile_pic_bucket: string | null
          profile_pic_key: string | null
          seats: number
          state: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_status: Database["public"]["Enums"]["vehicle_status"]
          vin: string | null
          year: number
        }
        Insert: {
          color?: string | null
          id?: string
          licenseplate?: string | null
          make?: string
          model?: string
          name: string
          notes?: string | null
          pet_name?: string | null
          profile_pic_bucket?: string | null
          profile_pic_key?: string | null
          seats?: number
          state?: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_status?: Database["public"]["Enums"]["vehicle_status"]
          vin?: string | null
          year?: number
        }
        Update: {
          color?: string | null
          id?: string
          licenseplate?: string | null
          make?: string
          model?: string
          name?: string
          notes?: string | null
          pet_name?: string | null
          profile_pic_bucket?: string | null
          profile_pic_key?: string | null
          seats?: number
          state?: string | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          vehicle_status?: Database["public"]["Enums"]["vehicle_status"]
          vin?: string | null
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
      dispatch_locations: "NV" | "CA" | "MI"
      dispatch_status: "claimed" | "open" | "closed"
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
      tag_status: "open" | "closed"
      time_entry_status: "clocked_in" | "clocked_out" | "on_break"
      user_type: "employee" | "customer" | "partner"
      vehicle_fuel_level: "quarter" | "half" | "three_quarters" | "full"
      vehicle_status: "broken" | "maintenance" | "fine" | "former"
      vehicle_tag_type: "maintenance" | "repair"
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
        | "gocart"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

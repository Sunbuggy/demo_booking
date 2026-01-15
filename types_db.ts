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
    PostgrestVersion: "12.1 (8cbcf98)"
  }
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
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      adventure: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          imageUrl: string | null
          title: string | null
          videoUrl: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          imageUrl?: string | null
          title?: string | null
          videoUrl?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
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
      adventure_discounts: {
        Row: {
          adventure_id: string | null
          created_at: string
          created_by: string | null
          discount_amt: number | null
          discount_percent: number | null
          end_date: string | null
          id: string
          start_date: string | null
        }
        Insert: {
          adventure_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amt?: number | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          start_date?: string | null
        }
        Update: {
          adventure_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amt?: number | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adventure_discounts_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adventure_discounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      adventure_pricing: {
        Row: {
          adventure_id: string | null
          adventure_vehicle_id: string | null
          created_at: string
          created_by: string | null
          id: string
          price: number
        }
        Insert: {
          adventure_id?: string | null
          adventure_vehicle_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          price: number
        }
        Update: {
          adventure_id?: string | null
          adventure_vehicle_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "adventure_pricing_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adventure_pricing_adventure_id_fkey1"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventure_vehicle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adventure_pricing_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      adventure_unavailability: {
        Row: {
          adventure_id: string | null
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          time_range_start: string
          timerange_end: string | null
        }
        Insert: {
          adventure_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          time_range_start: string
          timerange_end?: string | null
        }
        Update: {
          adventure_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          time_range_start?: string
          timerange_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adventure_unavailability_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adventure_unavailability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      adventure_vehicle: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          seats: number | null
          type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          seats?: number | null
          type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          seats?: number | null
          type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "adventure_vehicle_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          id: string
          row: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          id?: string
          row?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          row?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_table_queue: {
        Row: {
          created_at: string
          id: number
          table: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          table?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          table?: string | null
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
      charges_pismo: {
        Row: {
          amount: string | null
          created_at: string | null
          created_by: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          reservation_number: string | null
        }
        Insert: {
          amount?: string | null
          created_at?: string | null
          created_by?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          reservation_number?: string | null
        }
        Update: {
          amount?: string | null
          created_at?: string | null
          created_by?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          reservation_number?: string | null
        }
        Relationships: []
      }
      clock_in: {
        Row: {
          clock_in_time: string | null
          created_at: string
          id: string
          image: string | null
          image_url: string | null
          lat: number | null
          long: number | null
        }
        Insert: {
          clock_in_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          image_url?: string | null
          lat?: number | null
          long?: number | null
        }
        Update: {
          clock_in_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          image_url?: string | null
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
          image_url: string | null
          lat: number | null
          long: number | null
        }
        Insert: {
          clock_out_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          image_url?: string | null
          lat?: number | null
          long?: number | null
        }
        Update: {
          clock_out_time?: string | null
          created_at?: string
          id?: string
          image?: string | null
          image_url?: string | null
          lat?: number | null
          long?: number | null
        }
        Relationships: []
      }
      customer_waivers: {
        Row: {
          id: string
          is_active: boolean | null
          location_tag: string | null
          pdf_url: string | null
          signed_at: string
          smartwaiver_waiver_id: string
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          location_tag?: string | null
          pdf_url?: string | null
          signed_at: string
          smartwaiver_waiver_id: string
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          location_tag?: string | null
          pdf_url?: string | null
          signed_at?: string
          smartwaiver_waiver_id?: string
          template_id?: string
          user_id?: string
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
      daily_shuttle_manifest: {
        Row: {
          capacity: number | null
          created_at: string | null
          created_by: string | null
          date: string
          driver_id: string
          id: string
          vehicle_id: string
          vehicle_name: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          driver_id: string
          id?: string
          vehicle_id: string
          vehicle_name?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          driver_id?: string
          id?: string
          vehicle_id?: string
          vehicle_name?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          location_id: string | null
          name: string
          sort_order: number | null
          style_class: string | null
        }
        Insert: {
          id?: string
          location_id?: string | null
          name: string
          sort_order?: number | null
          style_class?: string | null
        }
        Update: {
          id?: string
          location_id?: string | null
          name?: string
          sort_order?: number | null
          style_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      email_logs: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status: string
          subject: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_template: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          subject_template: string
        }
        Insert: {
          body_template: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          subject_template: string
        }
        Update: {
          body_template?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          subject_template?: string
        }
        Relationships: []
      }
      employee_availability_patterns: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          preference_level: Database["public"]["Enums"]["availability_preference"]
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          preference_level?: Database["public"]["Enums"]["availability_preference"]
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          preference_level?: Database["public"]["Enums"]["availability_preference"]
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_details: {
        Row: {
          department: string | null
          dialpad_id: string | null
          dialpad_number: string | null
          emp_id: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          payroll_company: string | null
          primary_position: string | null
          primary_work_location: string | null
          time_correction_count: number | null
          timeclock_blocked: boolean | null
          user_id: string | null
          work_phone: string | null
        }
        Insert: {
          department?: string | null
          dialpad_id?: string | null
          dialpad_number?: string | null
          emp_id?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          payroll_company?: string | null
          primary_position?: string | null
          primary_work_location?: string | null
          time_correction_count?: number | null
          timeclock_blocked?: boolean | null
          user_id?: string | null
          work_phone?: string | null
        }
        Update: {
          department?: string | null
          dialpad_id?: string | null
          dialpad_number?: string | null
          emp_id?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          payroll_company?: string | null
          primary_position?: string | null
          primary_work_location?: string | null
          time_correction_count?: number | null
          timeclock_blocked?: boolean | null
          user_id?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          location: string | null
          location_id: string | null
          role: string | null
          start_time: string
          task: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          location?: string | null
          location_id?: string | null
          role?: string | null
          start_time: string
          task?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          location?: string | null
          location_id?: string | null
          role?: string | null
          start_time?: string
          task?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_schedules_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_type_settings: {
        Row: {
          icon_name: string
          updated_at: string | null
          updated_by: string | null
          vehicle_type: string
        }
        Insert: {
          icon_name: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_type: string
        }
        Update: {
          icon_name?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      group_timings: {
        Row: {
          created_at: string | null
          group_id: string
          landed_at: string | null
          launched_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          landed_at?: string | null
          launched_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          landed_at?: string | null
          launched_at?: string | null
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
          shuttle_assignment_id: string | null
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
          shuttle_assignment_id?: string | null
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
          shuttle_assignment_id?: string | null
          sweep?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_shuttle_assignment_id_fkey"
            columns: ["shuttle_assignment_id"]
            isOneToOne: false
            referencedRelation: "shuttle_assignment"
            referencedColumns: ["id"]
          },
        ]
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
      location_geofences: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          description: string | null
          id: number
          name: string
          polygon_coords: Json | null
          radius_miles: number | null
          type: string
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          description?: string | null
          id?: number
          name: string
          polygon_coords?: Json | null
          radius_miles?: number | null
          type: string
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          description?: string | null
          id?: number
          name?: string
          polygon_coords?: Json | null
          radius_miles?: number | null
          type?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      payroll_reports: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: []
      }
      pismo_booking_items: {
        Row: {
          has_waiver: boolean | null
          id: string
          pismo_booking_id: string | null
          price_at_booking: number
          pricing_category_id: string | null
          quantity: number
          vehicle_name_snapshot: string | null
        }
        Insert: {
          has_waiver?: boolean | null
          id?: string
          pismo_booking_id?: string | null
          price_at_booking: number
          pricing_category_id?: string | null
          quantity: number
          vehicle_name_snapshot?: string | null
        }
        Update: {
          has_waiver?: boolean | null
          id?: string
          pismo_booking_id?: string | null
          price_at_booking?: number
          pricing_category_id?: string | null
          quantity?: number
          vehicle_name_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pismo_booking_items_pismo_booking_id_fkey"
            columns: ["pismo_booking_id"]
            isOneToOne: false
            referencedRelation: "pismo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pismo_booking_items_pricing_category_id_fkey"
            columns: ["pricing_category_id"]
            isOneToOne: false
            referencedRelation: "pismo_pricing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      pismo_booking_logs: {
        Row: {
          action_description: string
          booking_id: string | null
          created_at: string | null
          editor_name: string
          id: string
        }
        Insert: {
          action_description: string
          booking_id?: string | null
          created_at?: string | null
          editor_name: string
          id?: string
        }
        Update: {
          action_description?: string
          booking_id?: string | null
          created_at?: string | null
          editor_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pismo_booking_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "pismo_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pismo_booking_notes: {
        Row: {
          author_name: string
          booking_id: string | null
          created_at: string | null
          id: string
          note_text: string
        }
        Insert: {
          author_name: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          note_text: string
        }
        Update: {
          author_name?: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "pismo_booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "pismo_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pismo_bookings: {
        Row: {
          adults: number | null
          bandannas_qty: number | null
          booked_by: string | null
          booking_date: string
          created_at: string | null
          duration_hours: number
          email: string
          end_time: string
          first_name: string
          goggles_qty: number | null
          id: string
          last_name: string
          minors: number | null
          notes: string | null
          phone: string
          reservation_id: number
          start_time: string
          status: string | null
          total_amount: number
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          adults?: number | null
          bandannas_qty?: number | null
          booked_by?: string | null
          booking_date: string
          created_at?: string | null
          duration_hours: number
          email: string
          end_time: string
          first_name: string
          goggles_qty?: number | null
          id?: string
          last_name: string
          minors?: number | null
          notes?: string | null
          phone: string
          reservation_id?: number
          start_time: string
          status?: string | null
          total_amount: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          adults?: number | null
          bandannas_qty?: number | null
          booked_by?: string | null
          booking_date?: string
          created_at?: string | null
          duration_hours?: number
          email?: string
          end_time?: string
          first_name?: string
          goggles_qty?: number | null
          id?: string
          last_name?: string
          minors?: number | null
          notes?: string | null
          phone?: string
          reservation_id?: number
          start_time?: string
          status?: string | null
          total_amount?: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pismo_pricing_rules: {
        Row: {
          belt: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          damage_waiver: number | null
          days_of_week: number[] | null
          deposit: number | null
          end_date: string | null
          end_time: string | null
          fleet_prefixes: string[] | null
          id: string
          name: string | null
          online: boolean | null
          phone: boolean | null
          price_1_5hr: number | null
          price_1hr: number | null
          price_2_5hr: number | null
          price_2hr: number | null
          price_3_5hr: number | null
          price_3hr: number | null
          price_4hr: number | null
          search_term: string | null
          seats: number | null
          sort_order: number | null
          start_date: string
          start_time: string | null
          type_vehicle: string | null
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
          vehicle_id: string | null
          vehicle_name: string
        }
        Insert: {
          belt?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          damage_waiver?: number | null
          days_of_week?: number[] | null
          deposit?: number | null
          end_date?: string | null
          end_time?: string | null
          fleet_prefixes?: string[] | null
          id?: string
          name?: string | null
          online?: boolean | null
          phone?: boolean | null
          price_1_5hr?: number | null
          price_1hr?: number | null
          price_2_5hr?: number | null
          price_2hr?: number | null
          price_3_5hr?: number | null
          price_3hr?: number | null
          price_4hr?: number | null
          search_term?: string | null
          seats?: number | null
          sort_order?: number | null
          start_date: string
          start_time?: string | null
          type_vehicle?: string | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          vehicle_id?: string | null
          vehicle_name: string
        }
        Update: {
          belt?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          damage_waiver?: number | null
          days_of_week?: number[] | null
          deposit?: number | null
          end_date?: string | null
          end_time?: string | null
          fleet_prefixes?: string[] | null
          id?: string
          name?: string | null
          online?: boolean | null
          phone?: boolean | null
          price_1_5hr?: number | null
          price_1hr?: number | null
          price_2_5hr?: number | null
          price_2hr?: number | null
          price_3_5hr?: number | null
          price_3hr?: number | null
          price_4hr?: number | null
          search_term?: string | null
          seats?: number | null
          sort_order?: number | null
          start_date?: string
          start_time?: string | null
          type_vehicle?: string | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          vehicle_id?: string | null
          vehicle_name?: string
        }
        Relationships: []
      }
      pismo_rental_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          days_of_week: number[]
          end_date: string
          first_start_time: string | null
          id: number
          last_end_offset_minutes: number | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          days_of_week: number[]
          end_date: string
          first_start_time?: string | null
          id?: number
          last_end_offset_minutes?: number | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          days_of_week?: number[]
          end_date?: string
          first_start_time?: string | null
          id?: number
          last_end_offset_minutes?: number | null
          start_date?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          keyword: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          keyword?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          keyword?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      reservation_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          manifest_id: string
          pax_count: number
          reservation_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          manifest_id: string
          pax_count: number
          reservation_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          manifest_id?: string
          pax_count?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_assignments_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "daily_shuttle_manifest"
            referencedColumns: ["id"]
          },
        ]
      }
      rollcall_vehicles: {
        Row: {
          created_at: string | null
          departed_at: string | null
          departed_user_id: string | null
          id: string
          returned_at: string | null
          returned_user_id: string | null
          rollcall_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          departed_at?: string | null
          departed_user_id?: string | null
          id?: string
          returned_at?: string | null
          returned_user_id?: string | null
          rollcall_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          departed_at?: string | null
          departed_user_id?: string | null
          id?: string
          returned_at?: string | null
          returned_user_id?: string | null
          rollcall_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rollcall_vehicles_rollcall_id_fkey"
            columns: ["rollcall_id"]
            isOneToOne: false
            referencedRelation: "rollcalls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rollcall_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rollcalls: {
        Row: {
          created_at: string | null
          end_location: string
          id: string
          name: string
          occasion: string | null
          start_location: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_location: string
          id?: string
          name: string
          occasion?: string | null
          start_location: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_location?: string
          id?: string
          name?: string
          occasion?: string | null
          start_location?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rollcalls_end_location_fkey"
            columns: ["end_location"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rollcalls_start_location_fkey"
            columns: ["start_location"]
            isOneToOne: false
            referencedRelation: "locations"
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
      shuttle_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          details: Json | null
          id: string
          timestamp: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          audit_trail: Json | null
          break_start: string | null
          clock_in_id: string | null
          clock_in_lat: number | null
          clock_in_lon: number | null
          clock_in_photo_url: string | null
          clock_out_id: string | null
          clock_out_lat: number | null
          clock_out_location: Json | null
          clock_out_lon: number | null
          clock_out_photo_url: string | null
          created_at: string | null
          date: string | null
          duration: number | null
          end_time: string | null
          id: string
          is_on_break: boolean | null
          location: string | null
          notes: string | null
          role: string | null
          start_time: string | null
          status: string | null
          total_break_minutes: number | null
          user_id: string | null
        }
        Insert: {
          audit_trail?: Json | null
          break_start?: string | null
          clock_in_id?: string | null
          clock_in_lat?: number | null
          clock_in_lon?: number | null
          clock_in_photo_url?: string | null
          clock_out_id?: string | null
          clock_out_lat?: number | null
          clock_out_location?: Json | null
          clock_out_lon?: number | null
          clock_out_photo_url?: string | null
          created_at?: string | null
          date?: string | null
          duration?: number | null
          end_time?: string | null
          id?: string
          is_on_break?: boolean | null
          location?: string | null
          notes?: string | null
          role?: string | null
          start_time?: string | null
          status?: string | null
          total_break_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          audit_trail?: Json | null
          break_start?: string | null
          clock_in_id?: string | null
          clock_in_lat?: number | null
          clock_in_lon?: number | null
          clock_in_photo_url?: string | null
          clock_out_id?: string | null
          clock_out_lat?: number | null
          clock_out_location?: Json | null
          clock_out_lon?: number | null
          clock_out_photo_url?: string | null
          created_at?: string | null
          date?: string | null
          duration?: number | null
          end_time?: string | null
          id?: string
          is_on_break?: boolean | null
          location?: string | null
          notes?: string | null
          role?: string | null
          start_time?: string | null
          status?: string | null
          total_break_minutes?: number | null
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
      time_off_requests: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          manager_note: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          manager_note?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          manager_note?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          department: string | null
          email: string | null
          external_metadata: Json | null
          first_name: string | null
          full_name: string | null
          fun_license_id: string | null
          hire_date: string | null
          homepage: string | null
          id: string
          job_title: string | null
          last_name: string | null
          license_photo_url: string | null
          license_signed_at: string | null
          location: string | null
          phone: string | null
          photo_url: string | null
          stage_name: string | null
          time_entry_status:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          timeclock_blocked: boolean | null
          user_level: number | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bg_image?: string | null
          bg_position?: string | null
          bg_repeat?: string | null
          bg_size?: string | null
          department?: string | null
          email?: string | null
          external_metadata?: Json | null
          first_name?: string | null
          full_name?: string | null
          fun_license_id?: string | null
          hire_date?: string | null
          homepage?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          license_photo_url?: string | null
          license_signed_at?: string | null
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          stage_name?: string | null
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          timeclock_blocked?: boolean | null
          user_level?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bg_image?: string | null
          bg_position?: string | null
          bg_repeat?: string | null
          bg_size?: string | null
          department?: string | null
          email?: string | null
          external_metadata?: Json | null
          first_name?: string | null
          full_name?: string | null
          fun_license_id?: string | null
          hire_date?: string | null
          homepage?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          license_photo_url?: string | null
          license_signed_at?: string | null
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          stage_name?: string | null
          time_entry_status?:
            | Database["public"]["Enums"]["time_entry_status"]
            | null
          timeclock_blocked?: boolean | null
          user_level?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
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
      vehicle_inspections: {
        Row: {
          checklist_data: Json
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          passed: boolean | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          checklist_data?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          checklist_data?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
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
          latitude: number
          longitude: number
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
          latitude?: number
          longitude?: number
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
          latitude?: number
          longitude?: number
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
          closed_by: string | null
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
          closed_by?: string | null
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
          closed_by?: string | null
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
            foreignKeyName: "vehicle_tag_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          exp_date: string | null
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
          exp_date?: string | null
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
          exp_date?: string | null
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
      weather_cache: {
        Row: {
          date: string
          id: string
          location: string
          max_temp_f: number | null
          min_temp_f: number | null
          precipitation_chance: number | null
          updated_at: string | null
          weather_code: number | null
        }
        Insert: {
          date: string
          id?: string
          location: string
          max_temp_f?: number | null
          min_temp_f?: number | null
          precipitation_chance?: number | null
          updated_at?: string | null
          weather_code?: number | null
        }
        Update: {
          date?: string
          id?: string
          location?: string
          max_temp_f?: number | null
          min_temp_f?: number | null
          precipitation_chance?: number | null
          updated_at?: string | null
          weather_code?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_clock_out: { Args: never; Returns: undefined }
      clock_in_user: { Args: { user_id: string }; Returns: undefined }
      clock_out_user: { Args: { user_id: string }; Returns: undefined }
      get_email_conflicts: {
        Args: never
        Returns: {
          account_count: number
          accounts: Json
          shared_email: string
        }[]
      }
      get_my_level: { Args: never; Returns: number }
      get_null_email_profiles: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          last_sign_in: string
          user_level: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_high_level_user: { Args: { uid: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      availability_preference:
        | "unavailable"
        | "available"
        | "preferred"
        | "preferred_off"
      dispatch_locations: "NV" | "CA" | "MI"
      dispatch_status: "claimed" | "open" | "closed"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      request_progress: "rejected" | "pending" | "accepted"
      request_status: "pending" | "approved" | "denied"
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
      availability_preference: [
        "unavailable",
        "available",
        "preferred",
        "preferred_off",
      ],
      dispatch_locations: ["NV", "CA", "MI"],
      dispatch_status: ["claimed", "open", "closed"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      request_progress: ["rejected", "pending", "accepted"],
      request_status: ["pending", "approved", "denied"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
      tag_status: ["open", "closed"],
      time_entry_status: ["clocked_in", "clocked_out", "on_break"],
      user_type: ["employee", "customer", "partner"],
      vehicle_fuel_level: ["quarter", "half", "three_quarters", "full"],
      vehicle_status: ["broken", "maintenance", "fine", "former"],
      vehicle_tag_type: ["maintenance", "repair"],
      vehicle_type: [
        "shuttle",
        "buggy",
        "atv",
        "utv",
        "sedan",
        "truck",
        "trailer",
        "tram",
        "forktruck",
        "gocart",
      ],
    },
  },
} as const

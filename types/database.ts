export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Partial<Tenant> & { slug: string; name: string };
        Update: Partial<Tenant>;
      };
      services: {
        Row: Service;
        Insert: Partial<Service> & { tenant_id: string; name: string; duration_minutes: number; price: number };
        Update: Partial<Service>;
      };
      staff: {
        Row: Staff;
        Insert: Partial<Staff> & { tenant_id: string; name: string };
        Update: Partial<Staff>;
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment> & { tenant_id: string; service_id: string; customer_name: string; customer_phone: string; start_at: string; end_at: string };
        Update: Partial<Appointment>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer> & { tenant_id: string; name: string; phone: string };
        Update: Partial<Customer>;
      };
      business_hours: {
        Row: BusinessHours;
        Insert: Partial<BusinessHours> & { tenant_id: string; day_of_week: number };
        Update: Partial<BusinessHours>;
      };
      service_categories: {
        Row: ServiceCategory;
        Insert: Partial<ServiceCategory> & { tenant_id: string; name: string };
        Update: Partial<ServiceCategory>;
      };
      staff_schedules: {
        Row: StaffSchedule;
        Insert: Partial<StaffSchedule> & { tenant_id: string; staff_id: string; day_of_week: number };
        Update: Partial<StaffSchedule>;
      };
      tenant_members: {
        Row: TenantMember;
        Insert: Partial<TenantMember> & { tenant_id: string; user_id: string };
        Update: Partial<TenantMember>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { id: string; email: string };
        Update: Partial<UserProfile>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  timezone: string;
  primary_color: string;
  accent_color: string;
  booking_advance_days: number;
  cancellation_hours: number;
  onboarding_step: number;
  onboarding_completed: boolean;
  is_active: boolean;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  buffer_minutes: number;
  is_active: boolean;
  is_popular: boolean;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  tenant_id: string;
  user_id: string | null;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  calendar_color: string;
  is_active: boolean;
  accepts_bookings: boolean;
  sort_order: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  staff_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  start_at: string;
  end_at: string;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "no_show";
  price: number | null;
  notes: string | null;
  internal_notes: string | null;
  source: string;
  cancellation_reason: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  notes: string | null;
  tags: string[];
  no_show_count: number;
  visit_count: number;
  total_spent: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  tenant_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface StaffSchedule {
  id: string;
  tenant_id: string;
  staff_id: string;
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: "owner" | "admin" | "staff";
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

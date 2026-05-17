import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingShell } from "@/components/booking/BookingShell";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("tenants").select("name, category, primary_color").eq("slug", params.slug).single();
  return {
    title: data ? `${data.name} — קביעת תור` : "קביעת תור",
    description: `קבע תור ב${data?.name ?? ""}`,
    themeColor: data?.primary_color ?? "#4F46E5",
  };
}

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!tenant) notFound();

  const [{ data: services }, { data: staff }, { data: businessHours }] = await Promise.all([
    supabase.from("services").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("sort_order"),
    supabase.from("staff").select("*").eq("tenant_id", tenant.id).eq("is_active", true).eq("accepts_bookings", true).order("sort_order"),
    supabase.from("business_hours").select("*").eq("tenant_id", tenant.id).order("day_of_week"),
  ]);

  return (
    <BookingShell
      tenant={tenant}
      services={services ?? []}
      staff={staff ?? []}
      businessHours={businessHours ?? []}
    />
  );
}

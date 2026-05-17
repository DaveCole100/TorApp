import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, tenants, services, staff, businessHours } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { BookingShell } from "@/components/booking/BookingShell";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const [tenant] = await db
    .select({ name: tenants.name, category: tenants.category, primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.slug, params.slug))
    .limit(1);
  return {
    title: tenant ? `${tenant.name} — קביעת תור` : "קביעת תור",
    description: `קבע תור ב${tenant?.name ?? ""}`,
    themeColor: tenant?.primaryColor ?? "#4F46E5",
  };
}

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, params.slug), eq(tenants.isActive, true)))
    .limit(1);

  if (!tenant) notFound();

  const [servicesList, staffList, hoursList] = await Promise.all([
    db.select().from(services)
      .where(and(eq(services.tenantId, tenant.id), eq(services.isActive, true)))
      .orderBy(asc(services.sortOrder)),
    db.select().from(staff)
      .where(and(eq(staff.tenantId, tenant.id), eq(staff.isActive, true), eq(staff.acceptsBookings, true)))
      .orderBy(asc(staff.sortOrder)),
    db.select().from(businessHours)
      .where(eq(businessHours.tenantId, tenant.id))
      .orderBy(asc(businessHours.dayOfWeek)),
  ]);

  return (
    <BookingShell
      tenant={tenant}
      services={servicesList}
      staff={staffList}
      businessHours={hoursList}
    />
  );
}

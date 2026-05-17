import {
  pgTable, uuid, text, boolean, integer, numeric,
  timestamp, time, smallint, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName:     text("full_name"),
  avatarUrl:    text("avatar_url"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Tenants (businesses) ──────────────────────────────────────────────────────
export const tenants = pgTable("tenants", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  slug:                text("slug").notNull().unique(),
  name:                text("name").notNull(),
  category:            text("category"),
  description:         text("description"),
  logoUrl:             text("logo_url"),
  coverUrl:            text("cover_url"),
  phone:               text("phone"),
  whatsapp:            text("whatsapp"),
  email:               text("email"),
  instagram:           text("instagram"),
  website:             text("website"),
  address:             text("address"),
  timezone:            text("timezone").notNull().default("Asia/Jerusalem"),
  primaryColor:        text("primary_color").notNull().default("#4F46E5"),
  accentColor:         text("accent_color").notNull().default("#7C3AED"),
  bookingAdvanceDays:  integer("booking_advance_days").notNull().default(60),
  cancellationHours:   integer("cancellation_hours").notNull().default(24),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  isActive:            boolean("is_active").notNull().default(true),
  plan:                text("plan").notNull().default("free"),
  createdAt:           timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Tenant members ────────────────────────────────────────────────────────────
export const tenantMembers = pgTable("tenant_members", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:      text("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, t => ({ uniq: uniqueIndex("tm_unique").on(t.tenantId, t.userId) }));

// ── Business hours ────────────────────────────────────────────────────────────
export const businessHours = pgTable("business_hours", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dayOfWeek:  smallint("day_of_week").notNull(),
  isOpen:     boolean("is_open").notNull().default(true),
  openTime:   time("open_time").notNull().default("09:00"),
  closeTime:  time("close_time").notNull().default("18:00"),
}, t => ({ uniq: uniqueIndex("bh_unique").on(t.tenantId, t.dayOfWeek) }));

// ── Service categories ────────────────────────────────────────────────────────
export const serviceCategories = pgTable("service_categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  emoji:     text("emoji"),
  color:     text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Services ──────────────────────────────────────────────────────────────────
export const services = pgTable("services", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId:      uuid("category_id").references(() => serviceCategories.id, { onDelete: "set null" }),
  name:            text("name").notNull(),
  description:     text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  price:           numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  bufferMinutes:   integer("buffer_minutes").notNull().default(0),
  isActive:        boolean("is_active").notNull().default(true),
  isPopular:       boolean("is_popular").notNull().default(false),
  imageUrl:        text("image_url"),
  sortOrder:       integer("sort_order").notNull().default(0),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => ({ tenantIdx: index("services_tenant_idx").on(t.tenantId) }));

// ── Staff ─────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:         uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name:           text("name").notNull(),
  role:           text("role"),
  bio:            text("bio"),
  avatarUrl:      text("avatar_url"),
  email:          text("email"),
  phone:          text("phone"),
  calendarColor:  text("calendar_color").notNull().default("#4F46E5"),
  isActive:       boolean("is_active").notNull().default(true),
  acceptsBookings:boolean("accepts_bookings").notNull().default(true),
  sortOrder:      integer("sort_order").notNull().default(0),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Staff schedules ───────────────────────────────────────────────────────────
export const staffSchedules = pgTable("staff_schedules", {
  id:          uuid("id").primaryKey().defaultRandom(),
  tenantId:    uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  staffId:     uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  dayOfWeek:   smallint("day_of_week").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  startTime:   time("start_time").notNull().default("09:00"),
  endTime:     time("end_time").notNull().default("18:00"),
}, t => ({ uniq: uniqueIndex("ss_unique").on(t.staffId, t.dayOfWeek) }));

// ── Customers ─────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name:         text("name").notNull(),
  email:        text("email"),
  phone:        text("phone").notNull(),
  notes:        text("notes"),
  noShowCount:  integer("no_show_count").notNull().default(0),
  visitCount:   integer("visit_count").notNull().default(0),
  totalSpent:   numeric("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  lastVisitAt:  timestamp("last_visit_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => ({ uniq: uniqueIndex("cust_unique").on(t.tenantId, t.phone) }));

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointments = pgTable("appointments", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  tenantId:           uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  serviceId:          uuid("service_id").notNull().references(() => services.id),
  staffId:            uuid("staff_id").references(() => staff.id),
  customerId:         uuid("customer_id").references(() => customers.id),
  customerName:       text("customer_name").notNull(),
  customerPhone:      text("customer_phone").notNull(),
  customerEmail:      text("customer_email"),
  startAt:            timestamp("start_at", { withTimezone: true }).notNull(),
  endAt:              timestamp("end_at", { withTimezone: true }).notNull(),
  status:             text("status").notNull().default("confirmed"),
  price:              numeric("price", { precision: 10, scale: 2 }),
  notes:              text("notes"),
  internalNotes:      text("internal_notes"),
  source:             text("source").notNull().default("online"),
  cancellationReason: text("cancellation_reason"),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => ({
  tenantStartIdx: index("appt_tenant_start_idx").on(t.tenantId, t.startAt),
  staffStartIdx:  index("appt_staff_start_idx").on(t.staffId, t.startAt),
}));

// ── Type exports ──────────────────────────────────────────────────────────────
export type User            = typeof users.$inferSelect;
export type Tenant          = typeof tenants.$inferSelect;
export type TenantMember    = typeof tenantMembers.$inferSelect;
export type BusinessHours   = typeof businessHours.$inferSelect;
export type Service         = typeof services.$inferSelect;
export type Staff           = typeof staff.$inferSelect;
export type StaffSchedule   = typeof staffSchedules.$inferSelect;
export type Customer        = typeof customers.$inferSelect;
export type Appointment     = typeof appointments.$inferSelect;

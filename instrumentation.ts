export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          logo_url TEXT,
          cover_url TEXT,
          phone TEXT,
          whatsapp TEXT,
          email TEXT,
          instagram TEXT,
          website TEXT,
          address TEXT,
          timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
          primary_color TEXT NOT NULL DEFAULT '#0284C7',
          accent_color TEXT NOT NULL DEFAULT '#059669',
          booking_advance_days INTEGER NOT NULL DEFAULT 60,
          cancellation_hours INTEGER NOT NULL DEFAULT 24,
          onboarding_completed BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          plan TEXT NOT NULL DEFAULT 'free',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS tenant_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'owner',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(tenant_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS business_hours (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          day_of_week SMALLINT NOT NULL,
          is_open BOOLEAN NOT NULL DEFAULT true,
          open_time TIME NOT NULL DEFAULT '09:00',
          close_time TIME NOT NULL DEFAULT '18:00',
          UNIQUE(tenant_id, day_of_week)
        );
        CREATE TABLE IF NOT EXISTS service_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          emoji TEXT,
          color TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT,
          duration_minutes INTEGER NOT NULL DEFAULT 30,
          price NUMERIC(10,2) NOT NULL DEFAULT 0,
          buffer_minutes INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_popular BOOLEAN NOT NULL DEFAULT false,
          image_url TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS staff (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          role TEXT,
          bio TEXT,
          avatar_url TEXT,
          email TEXT,
          phone TEXT,
          calendar_color TEXT NOT NULL DEFAULT '#0284C7',
          is_active BOOLEAN NOT NULL DEFAULT true,
          accepts_bookings BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS staff_schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
          day_of_week SMALLINT NOT NULL,
          is_available BOOLEAN NOT NULL DEFAULT true,
          start_time TIME NOT NULL DEFAULT '09:00',
          end_time TIME NOT NULL DEFAULT '18:00',
          UNIQUE(staff_id, day_of_week)
        );
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT NOT NULL,
          notes TEXT,
          no_show_count INTEGER NOT NULL DEFAULT 0,
          visit_count INTEGER NOT NULL DEFAULT 0,
          total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
          last_visit_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(tenant_id, phone)
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          service_id UUID NOT NULL REFERENCES services(id),
          staff_id UUID REFERENCES staff(id),
          customer_id UUID REFERENCES customers(id),
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_email TEXT,
          start_at TIMESTAMPTZ NOT NULL,
          end_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'confirmed',
          price NUMERIC(10,2),
          notes TEXT,
          internal_notes TEXT,
          source TEXT NOT NULL DEFAULT 'online',
          cancellation_reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS appt_tenant_start_idx ON appointments(tenant_id, start_at);
        CREATE INDEX IF NOT EXISTS appt_staff_start_idx ON appointments(staff_id, start_at);
      `;
      console.log("✅ Database tables ready");
    } catch (err) {
      console.error("❌ DB setup error:", err);
    } finally {
      await sql.end();
    }
  }
}

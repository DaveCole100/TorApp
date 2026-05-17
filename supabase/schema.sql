-- ============================================================
-- TorApp SaaS — Production Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ──────────────────────────────────────────
-- TENANTS (businesses)
-- ──────────────────────────────────────────
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  category            TEXT,
  description         TEXT,
  logo_url            TEXT,
  cover_url           TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  email               TEXT,
  instagram           TEXT,
  website             TEXT,
  address             TEXT,
  city                TEXT,
  timezone            TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  primary_color       TEXT NOT NULL DEFAULT '#4F46E5',
  accent_color        TEXT NOT NULL DEFAULT '#7C3AED',
  booking_advance_days INTEGER NOT NULL DEFAULT 60,
  cancellation_hours   INTEGER NOT NULL DEFAULT 24,
  onboarding_step      INTEGER NOT NULL DEFAULT 1,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  plan                TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- USER PROFILES
-- ──────────────────────────────────────────
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- TENANT MEMBERS (roles per tenant)
-- ──────────────────────────────────────────
CREATE TABLE tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'owner', -- owner | admin | staff
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ──────────────────────────────────────────
-- BUSINESS HOURS
-- ──────────────────────────────────────────
CREATE TABLE business_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open       BOOLEAN NOT NULL DEFAULT true,
  open_time     TIME NOT NULL DEFAULT '09:00',
  close_time    TIME NOT NULL DEFAULT '18:00',
  UNIQUE(tenant_id, day_of_week)
);

-- ──────────────────────────────────────────
-- SERVICE CATEGORIES
-- ──────────────────────────────────────────
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  emoji       TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- SERVICES
-- ──────────────────────────────────────────
CREATE TABLE services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  duration_minutes    INTEGER NOT NULL DEFAULT 30,
  price               NUMERIC(10,2) NOT NULL DEFAULT 0,
  buffer_minutes      INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  is_popular          BOOLEAN NOT NULL DEFAULT false,
  image_url           TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- STAFF
-- ──────────────────────────────────────────
CREATE TABLE staff (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  role              TEXT,
  bio               TEXT,
  avatar_url        TEXT,
  email             TEXT,
  phone             TEXT,
  calendar_color    TEXT DEFAULT '#4F46E5',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  accepts_bookings  BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff ↔ Services
CREATE TABLE staff_services (
  staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- Staff weekly schedules
CREATE TABLE staff_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_available  BOOLEAN NOT NULL DEFAULT true,
  start_time    TIME NOT NULL DEFAULT '09:00',
  end_time      TIME NOT NULL DEFAULT '18:00',
  UNIQUE(staff_id, day_of_week)
);

-- ──────────────────────────────────────────
-- CUSTOMERS (per tenant)
-- ──────────────────────────────────────────
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT NOT NULL,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  no_show_count   INTEGER NOT NULL DEFAULT 0,
  visit_count     INTEGER NOT NULL DEFAULT 0,
  total_spent     NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_visit_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- ──────────────────────────────────────────
-- APPOINTMENTS
-- ──────────────────────────────────────────
CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id          UUID NOT NULL REFERENCES services(id),
  staff_id            UUID REFERENCES staff(id),
  customer_id         UUID REFERENCES customers(id),
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  customer_email      TEXT,
  start_at            TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'confirmed',
  -- confirmed | pending | completed | cancelled | no_show
  price               NUMERIC(10,2),
  notes               TEXT,
  internal_notes      TEXT,
  source              TEXT NOT NULL DEFAULT 'online', -- online | manual | api
  cancellation_reason TEXT,
  reminder_sent_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_tenant_start ON appointments(tenant_id, start_at);
CREATE INDEX idx_appointments_staff_start  ON appointments(staff_id, start_at);
CREATE INDEX idx_appointments_status       ON appointments(tenant_id, status);

-- ──────────────────────────────────────────
-- BLOCKED TIMES (vacations, manual blocks)
-- ──────────────────────────────────────────
CREATE TABLE blocked_times (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id    UUID REFERENCES staff(id) ON DELETE CASCADE,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type            TEXT NOT NULL, -- confirmation | reminder | cancellation | reschedule
  channel         TEXT NOT NULL, -- email | sms | whatsapp
  recipient       TEXT NOT NULL,
  payload         JSONB,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  error           TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at    BEFORE UPDATE ON tenants    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at   BEFORE UPDATE ON services   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at  BEFORE UPDATE ON customers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────

-- Helper: get current user's tenant_id
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours     ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff              ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;

-- Tenants: members can read their own tenant
CREATE POLICY "tenant_select" ON tenants FOR SELECT USING (id = auth_tenant_id());
CREATE POLICY "tenant_update" ON tenants FOR UPDATE USING (id = auth_tenant_id());

-- All tenant-scoped tables: access own tenant only
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'business_hours','service_categories','services','staff',
    'staff_schedules','customers','appointments','blocked_times','notifications'
  ] LOOP
    EXECUTE format('CREATE POLICY "%s_tenant_all" ON %s USING (tenant_id = auth_tenant_id())', tbl, tbl);
  END LOOP;
END $$;

-- Public: booking pages can read tenant info + services + staff
CREATE POLICY "tenants_public_read"   ON tenants   FOR SELECT USING (is_active = true);
CREATE POLICY "services_public_read"  ON services  FOR SELECT USING (is_active = true);
CREATE POLICY "staff_public_read"     ON staff     FOR SELECT USING (is_active = true AND accepts_bookings = true);
CREATE POLICY "biz_hours_public_read" ON business_hours FOR SELECT USING (true);
CREATE POLICY "appts_public_insert"   ON appointments  FOR INSERT WITH CHECK (true);

-- User profiles
CREATE POLICY "profiles_own" ON user_profiles USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles(id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

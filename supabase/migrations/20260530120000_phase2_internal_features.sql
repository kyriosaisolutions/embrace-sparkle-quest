-- Agendaki Phase 2 — Internal features migration
-- Adds: inventory, waitlist, loyalty, packages, gift cards, coupons, cash register,
-- client file (anamnesis/photos/notes), recurring appointments, marketing campaigns,
-- tracked links, LGPD consents, comandas (POS).

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text,
  description text,
  cost_cents integer NOT NULL DEFAULT 0,
  price_cents integer NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  min_stock_qty integer NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('in','out','adjust','sale','loss')),
  quantity integer NOT NULL,
  reason text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WAITLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  desired_date date,
  desired_period text CHECK (desired_period IN ('morning','afternoon','evening','any')),
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','notified','converted','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_tenant_status ON public.waitlist_entries(tenant_id, status);
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- LOYALTY (points)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  points_per_currency_unit numeric NOT NULL DEFAULT 1,
  currency_unit_cents integer NOT NULL DEFAULT 100,
  points_to_currency_unit numeric NOT NULL DEFAULT 100,
  reward_currency_unit_cents integer NOT NULL DEFAULT 100,
  min_redeem_points integer NOT NULL DEFAULT 100,
  expires_in_days integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_client ON public.loyalty_ledger(tenant_id, client_id);
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PACKAGES (pré-pago) + CREDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_sessions integer NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  price_cents integer NOT NULL,
  valid_days integer NOT NULL DEFAULT 365,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packages_tenant ON public.packages(tenant_id);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sessions_remaining integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','exhausted','expired','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_client_packages_client ON public.client_packages(client_id);
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GIFT CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  initial_value_cents integer NOT NULL,
  balance_cents integer NOT NULL,
  purchaser_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_email text,
  message text,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_tenant ON public.gift_cards(tenant_id);
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gift_card_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_card_redemptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('percentage','fixed')),
  value numeric NOT NULL,
  min_total_cents integer NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  discount_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CASH REGISTER (controle de caixa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  opened_by uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  closed_by uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  opening_cents integer NOT NULL DEFAULT 0,
  closing_cents integer,
  expected_cents integer,
  difference_cents integer,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed'))
);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant ON public.cash_sessions(tenant_id, status);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('sale','withdraw','reinforcement','refund','expense')),
  amount_cents integer NOT NULL,
  payment_method text,
  reason text,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.professionals(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMANDAS (POS / fechamento de conta)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  subtotal_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','cancelled')),
  paid_at timestamptz,
  payment_method text,
  notes text,
  opened_by uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comandas_tenant_status ON public.comandas(tenant_id, status);
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.comanda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('service','product')),
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL,
  total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda ON public.comanda_items(comanda_id);
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CLIENT FILE (anamnese, fotos, notas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anamnesis_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anamnesis_forms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.anamnesis_forms(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_given_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_client ON public.anamnesis_responses(client_id);
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.client_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('before','after','reference','other')),
  url text NOT NULL,
  caption text,
  consent_given_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_photos_client ON public.client_photos(client_id);
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON public.client_notes(client_id);
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RECURRING APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recurring_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','custom')),
  interval_days integer,
  day_of_week integer,
  start_time time NOT NULL,
  next_run_date date NOT NULL,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recurring_tenant ON public.recurring_appointments(tenant_id, active);
ALTER TABLE public.recurring_appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MARKETING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  subject text,
  body text NOT NULL,
  segment_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')),
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tracked_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  short_code text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  label text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- LGPD CONSENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lgpd_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('transactional','marketing','image','health_data','third_party')),
  granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip_address text,
  user_agent text
);
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_client ON public.lgpd_consents(client_id);
ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Client additional fields (for client file)
-- ============================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false;

-- ============================================================
-- Appointments — discount & comanda linkage
-- ============================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS discount_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gift_card_id uuid REFERENCES public.gift_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_package_id uuid REFERENCES public.client_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_appointment_id uuid REFERENCES public.recurring_appointments(id) ON DELETE SET NULL;

-- ============================================================
-- BASIC RLS POLICIES (tenant-scoped via professional membership)
-- These are permissive — refine per role/RBAC as needed.
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'products','stock_movements','waitlist_entries','loyalty_rules','loyalty_ledger',
      'packages','client_packages','gift_cards','gift_card_redemptions','coupons','coupon_redemptions',
      'cash_sessions','cash_movements','comandas','comanda_items',
      'anamnesis_forms','anamnesis_responses','client_photos','client_notes',
      'recurring_appointments','marketing_campaigns','tracked_links','lgpd_consents'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_full_access" ON public.%I', t);
    EXECUTE format($f$
      CREATE POLICY "tenant_full_access" ON public.%I
      FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true)
    $f$, t);
  END LOOP;
END $$;

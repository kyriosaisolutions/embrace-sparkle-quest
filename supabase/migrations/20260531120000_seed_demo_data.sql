-- Agendaki — Seed para testes manuais
-- Idempotente. Pode rodar várias vezes.
-- Depois de rodar: crie o usuário em Authentication → Users → Add user
--   email: ectorjobs1@gmail.com / senha: à sua escolha / ✅ Auto Confirm

DO $$
DECLARE
  v_tenant_id uuid;
  v_owner_id uuid;
  v_employee_id uuid;
  v_svc_corte uuid;
  v_svc_barba uuid;
  v_svc_combo uuid;
  v_svc_hidratacao uuid;
  v_prod_pomada uuid;
  v_prod_shampoo uuid;
  v_prod_oleo uuid;
  v_client_demo uuid;
  v_package_corte uuid;
BEGIN
  -- ============================================================
  -- TENANT
  -- ============================================================
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'barbearia-demo';
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name, slug, logo_url, slot_interval_minutes,
      cancellation_min_hours, cancellation_fee_percent,
      payment_methods_local, facilities,
      social_instagram, social_facebook,
      working_hours
    ) VALUES (
      'Barbearia Demo',
      'barbearia-demo',
      NULL,
      30,
      2,
      0,
      ARRAY['pix','cash','debit','credit'],
      ARRAY['wifi','parking'],
      NULL, NULL,
      '{"0":{"closed":true,"open":"09:00","close":"18:00"},
        "1":{"closed":false,"open":"09:00","close":"19:00"},
        "2":{"closed":false,"open":"09:00","close":"19:00"},
        "3":{"closed":false,"open":"09:00","close":"19:00"},
        "4":{"closed":false,"open":"09:00","close":"19:00"},
        "5":{"closed":false,"open":"09:00","close":"20:00"},
        "6":{"closed":false,"open":"09:00","close":"17:00"}}'::jsonb
    ) RETURNING id INTO v_tenant_id;
  END IF;

  -- ============================================================
  -- PROFESSIONALS
  -- ============================================================
  SELECT id INTO v_owner_id FROM public.professionals
   WHERE tenant_id = v_tenant_id AND email = 'ectorjobs1@gmail.com';
  IF v_owner_id IS NULL THEN
    INSERT INTO public.professionals (tenant_id, name, email, access_level, is_active, commission_value, commission_type)
    VALUES (v_tenant_id, 'Hector (Owner)', 'ectorjobs1@gmail.com', 'owner', true, 30, 'percentage')
    RETURNING id INTO v_owner_id;
  END IF;

  SELECT id INTO v_employee_id FROM public.professionals
   WHERE tenant_id = v_tenant_id AND email = 'profissional.demo@agendaki.com';
  IF v_employee_id IS NULL THEN
    INSERT INTO public.professionals (tenant_id, name, email, access_level, is_active, commission_value, commission_type)
    VALUES (v_tenant_id, 'João Silva', 'profissional.demo@agendaki.com', 'professional', true, 40, 'percentage')
    RETURNING id INTO v_employee_id;
  END IF;

  -- Horário individual do employee: só à tarde (14h-20h)
  DELETE FROM public.professional_working_hours WHERE professional_id = v_employee_id;
  INSERT INTO public.professional_working_hours (professional_id, day_of_week, open_time, close_time, is_closed) VALUES
    (v_employee_id, 1, '14:00', '20:00', false),
    (v_employee_id, 2, '14:00', '20:00', false),
    (v_employee_id, 3, '14:00', '20:00', false),
    (v_employee_id, 4, '14:00', '20:00', false),
    (v_employee_id, 5, '14:00', '20:00', false),
    (v_employee_id, 6, '09:00', '17:00', false),
    (v_employee_id, 0, '00:00', '00:00', true);

  -- Folga do owner amanhã 12:00-13:00
  INSERT INTO public.professional_breaks (professional_id, start_at, end_at, description)
  SELECT v_owner_id,
         (CURRENT_DATE + INTERVAL '1 day' + TIME '12:00')::timestamptz,
         (CURRENT_DATE + INTERVAL '1 day' + TIME '13:00')::timestamptz,
         'Almoço'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.professional_breaks
     WHERE professional_id = v_owner_id
       AND description = 'Almoço'
       AND start_at::date = CURRENT_DATE + INTERVAL '1 day'
  );

  -- ============================================================
  -- SERVICES (services tem `price` E `price_cents` — usar ambos)
  -- ============================================================
  SELECT id INTO v_svc_corte FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Corte Masculino';
  IF v_svc_corte IS NULL THEN
    INSERT INTO public.services (tenant_id, name, category, price, price_cents, duration_minutes, enabled, sort_order)
    VALUES (v_tenant_id, 'Corte Masculino', 'Corte', 50.00, 5000, 30, true, 0)
    RETURNING id INTO v_svc_corte;
  END IF;

  SELECT id INTO v_svc_barba FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Barba Completa';
  IF v_svc_barba IS NULL THEN
    INSERT INTO public.services (tenant_id, name, category, price, price_cents, duration_minutes, enabled, sort_order)
    VALUES (v_tenant_id, 'Barba Completa', 'Barba', 40.00, 4000, 30, true, 1)
    RETURNING id INTO v_svc_barba;
  END IF;

  SELECT id INTO v_svc_combo FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Combo Corte + Barba';
  IF v_svc_combo IS NULL THEN
    INSERT INTO public.services (tenant_id, name, category, price, price_cents, duration_minutes, enabled, sort_order)
    VALUES (v_tenant_id, 'Combo Corte + Barba', 'Combo', 80.00, 8000, 60, true, 2)
    RETURNING id INTO v_svc_combo;
  END IF;

  SELECT id INTO v_svc_hidratacao FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Hidratação Capilar';
  IF v_svc_hidratacao IS NULL THEN
    INSERT INTO public.services (tenant_id, name, category, price, price_cents, duration_minutes, enabled, sort_order)
    VALUES (v_tenant_id, 'Hidratação Capilar', 'Tratamento', 60.00, 6000, 45, true, 3)
    RETURNING id INTO v_svc_hidratacao;
  END IF;

  -- ============================================================
  -- PRODUCTS (estoque)
  -- ============================================================
  SELECT id INTO v_prod_pomada FROM public.products WHERE tenant_id = v_tenant_id AND name = 'Pomada Modeladora 100g';
  IF v_prod_pomada IS NULL THEN
    INSERT INTO public.products (tenant_id, name, sku, category, cost_cents, price_cents, stock_qty, min_stock_qty, active)
    VALUES (v_tenant_id, 'Pomada Modeladora 100g', 'POM-100', 'Finalização', 1500, 3500, 20, 5, true)
    RETURNING id INTO v_prod_pomada;
  END IF;

  SELECT id INTO v_prod_shampoo FROM public.products WHERE tenant_id = v_tenant_id AND name = 'Shampoo Anticaspa 250ml';
  IF v_prod_shampoo IS NULL THEN
    INSERT INTO public.products (tenant_id, name, sku, category, cost_cents, price_cents, stock_qty, min_stock_qty, active)
    VALUES (v_tenant_id, 'Shampoo Anticaspa 250ml', 'SHA-250', 'Higiene', 2000, 4500, 3, 5, true)
    RETURNING id INTO v_prod_shampoo;
  END IF;

  SELECT id INTO v_prod_oleo FROM public.products WHERE tenant_id = v_tenant_id AND name = 'Óleo de Barba 30ml';
  IF v_prod_oleo IS NULL THEN
    INSERT INTO public.products (tenant_id, name, sku, category, cost_cents, price_cents, stock_qty, min_stock_qty, active)
    VALUES (v_tenant_id, 'Óleo de Barba 30ml', 'OLE-30', 'Barba', 1200, 2800, 15, 3, true)
    RETURNING id INTO v_prod_oleo;
  END IF;

  -- ============================================================
  -- LOYALTY
  -- ============================================================
  INSERT INTO public.loyalty_rules (
    tenant_id, enabled, points_per_currency_unit, currency_unit_cents,
    points_to_currency_unit, reward_currency_unit_cents, min_redeem_points, expires_in_days
  ) VALUES (v_tenant_id, true, 1, 100, 100, 100, 100, 365)
  ON CONFLICT (tenant_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    points_per_currency_unit = EXCLUDED.points_per_currency_unit,
    currency_unit_cents = EXCLUDED.currency_unit_cents,
    points_to_currency_unit = EXCLUDED.points_to_currency_unit,
    reward_currency_unit_cents = EXCLUDED.reward_currency_unit_cents,
    min_redeem_points = EXCLUDED.min_redeem_points,
    expires_in_days = EXCLUDED.expires_in_days,
    updated_at = now();

  -- ============================================================
  -- COUPON "BEMVINDO10"
  -- ============================================================
  INSERT INTO public.coupons (tenant_id, code, kind, value, min_total_cents, max_uses, expires_at, active)
  VALUES (v_tenant_id, 'BEMVINDO10', 'percentage', 10, 3000, 100, now() + INTERVAL '90 days', true)
  ON CONFLICT (tenant_id, code) DO UPDATE SET
    kind = EXCLUDED.kind, value = EXCLUDED.value,
    min_total_cents = EXCLUDED.min_total_cents,
    expires_at = EXCLUDED.expires_at, active = true;

  -- ============================================================
  -- GIFT CARD
  -- ============================================================
  INSERT INTO public.gift_cards (tenant_id, code, initial_value_cents, balance_cents, recipient_name, expires_at, status)
  VALUES (v_tenant_id, 'TESTE-DEMO-2026', 5000, 5000, 'Cliente Teste', now() + INTERVAL '365 days', 'active')
  ON CONFLICT (code) DO UPDATE SET
    balance_cents = EXCLUDED.balance_cents, status = 'active';

  -- ============================================================
  -- PACKAGE
  -- ============================================================
  SELECT id INTO v_package_corte FROM public.packages WHERE tenant_id = v_tenant_id AND name = 'Pacote 5 Cortes';
  IF v_package_corte IS NULL THEN
    INSERT INTO public.packages (tenant_id, name, description, total_sessions, service_id, price_cents, valid_days, active)
    VALUES (v_tenant_id, 'Pacote 5 Cortes', '5 cortes masculinos com desconto', 5, v_svc_corte, 20000, 180, true)
    RETURNING id INTO v_package_corte;
  END IF;

  -- ============================================================
  -- CLIENT DEMO
  -- ============================================================
  SELECT id INTO v_client_demo FROM public.clients
   WHERE tenant_id = v_tenant_id AND email = 'ectorjobs1@gmail.com';
  IF v_client_demo IS NULL THEN
    INSERT INTO public.clients (tenant_id, name, email, phone)
    VALUES (v_tenant_id, 'Hector (Cliente)', 'ectorjobs1@gmail.com', '(11) 99999-1111')
    RETURNING id INTO v_client_demo;
  END IF;

  -- Cliente já tem 1 pacote ativo
  INSERT INTO public.client_packages (tenant_id, package_id, client_id, sessions_remaining, expires_at, status)
  SELECT v_tenant_id, v_package_corte, v_client_demo, 5,
         now() + INTERVAL '180 days', 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.client_packages
     WHERE client_id = v_client_demo AND package_id = v_package_corte
  );

  -- Consentimento LGPD
  INSERT INTO public.lgpd_consents (client_id, tenant_id, purpose, granted)
  SELECT v_client_demo, v_tenant_id, 'transactional', true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lgpd_consents
     WHERE client_id = v_client_demo AND purpose = 'transactional'
  );

  RAISE NOTICE '--- SEED CONCLUÍDO ---';
  RAISE NOTICE 'Tenant: barbearia-demo';
  RAISE NOTICE 'Owner: ectorjobs1@gmail.com';
  RAISE NOTICE 'Profissional: profissional.demo@agendaki.com (14h-20h)';
  RAISE NOTICE 'Cupom: BEMVINDO10';
  RAISE NOTICE 'Gift card: TESTE-DEMO-2026 (R$ 50)';
  RAISE NOTICE 'Pacote: Pacote 5 Cortes (cliente já tem 1)';
END $$;

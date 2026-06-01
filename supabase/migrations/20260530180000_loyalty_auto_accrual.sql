-- Agendaki — Auto-accrual of loyalty points on appointment completion
-- Inserts a loyalty_ledger row whenever an appointment transitions to 'completed',
-- using the tenant's loyalty_rules to compute points and optional expiration.

DROP TRIGGER IF EXISTS trg_accrue_loyalty_on_completion ON public.appointments;
DROP FUNCTION IF EXISTS public.accrue_loyalty_on_completion();

CREATE OR REPLACE FUNCTION public.accrue_loyalty_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule           public.loyalty_rules%ROWTYPE;
    v_points         integer;
    v_current_balance integer;
    v_balance_after  integer;
    v_expires_at     timestamptz;
    v_total_cents    integer;
BEGIN
    -- Only act on real status transitions into 'completed'
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;
    IF NEW.status IS DISTINCT FROM 'completed' THEN
        RETURN NEW;
    END IF;
    IF OLD.status = 'completed' THEN
        RETURN NEW;
    END IF;

    -- Need a client to credit points to
    IF NEW.client_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Lookup loyalty rules for this tenant
    SELECT * INTO v_rule
    FROM public.loyalty_rules
    WHERE tenant_id = NEW.tenant_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF v_rule.enabled IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- Treat NULL total_cents as zero (will result in 0 points and early return)
    v_total_cents := COALESCE(NEW.total_cents, 0);

    -- Compute points: floor(total / unit_cents) * points_per_unit
    v_points := floor(
        (v_total_cents)::numeric / NULLIF(v_rule.currency_unit_cents, 0)
    ) * v_rule.points_per_currency_unit;

    IF v_points IS NULL OR v_points <= 0 THEN
        RETURN NEW;
    END IF;

    -- Current balance for this client at this tenant (NULL -> 0)
    SELECT COALESCE(SUM(delta), 0) INTO v_current_balance
    FROM public.loyalty_ledger
    WHERE tenant_id = NEW.tenant_id
      AND client_id = NEW.client_id;

    v_balance_after := v_current_balance + v_points;

    -- Compute expiration if rule defines it
    IF v_rule.expires_in_days IS NOT NULL THEN
        v_expires_at := NEW.starts_at + (v_rule.expires_in_days || ' days')::interval;
    ELSE
        v_expires_at := NULL;
    END IF;

    INSERT INTO public.loyalty_ledger (
        tenant_id,
        client_id,
        delta,
        balance_after,
        reason,
        appointment_id,
        expires_at
    ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        v_points,
        v_balance_after,
        'appointment_completed',
        NEW.id,
        v_expires_at
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_accrue_loyalty_on_completion
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.accrue_loyalty_on_completion();

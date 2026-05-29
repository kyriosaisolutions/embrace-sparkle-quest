-- Table for custom commission overrides (per professional per service)
CREATE TABLE IF NOT EXISTS public.professional_service_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5, 2) NOT NULL, -- percentage
    UNIQUE(professional_id, service_id)
);

-- Immutable commission log table
CREATE TABLE IF NOT EXISTS public.commission_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_price_cents INTEGER NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_cents INTEGER NOT NULL,
    paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.professional_service_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_service_commissions TO authenticated;
GRANT ALL ON public.professional_service_commissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_logs TO authenticated;
GRANT ALL ON public.commission_logs TO service_role;

CREATE POLICY "Allow authenticated access to professional_service_commissions" ON public.professional_service_commissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to commission_logs" ON public.commission_logs FOR ALL TO authenticated USING (true);

-- Function to calculate and log commission on appointment completion
CREATE OR REPLACE FUNCTION public.calculate_appointment_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_rate DECIMAL(5, 2);
    v_commission_cents INTEGER;
    v_service_price INTEGER;
BEGIN
    -- Only run when status changes to 'completed' and log doesn't exist
    IF (NEW.status = 'completed' AND OLD.status != 'completed') AND 
       NOT EXISTS (SELECT 1 FROM public.commission_logs WHERE appointment_id = NEW.id) THEN
        
        -- 1. Try to get custom rate for this pro + service
        SELECT commission_rate INTO v_commission_rate 
        FROM public.professional_service_commissions 
        WHERE professional_id = NEW.professional_id AND service_id = NEW.service_id;

        -- 2. Fallback to professional default rate if no override
        IF v_commission_rate IS NULL THEN
            SELECT commission_value INTO v_commission_rate 
            FROM public.professionals 
            WHERE id = NEW.professional_id AND commission_type = 'percentage';
        END IF;

        -- 3. Use 0 if still null (fixed salary pros or no rate set)
        v_commission_rate := COALESCE(v_commission_rate, 0);
        v_service_price := NEW.total_cents;
        v_commission_cents := (v_service_price * v_commission_rate) / 100;

        -- 4. Create immutable log
        INSERT INTO public.commission_logs (
            tenant_id, appointment_id, professional_id, 
            service_price_cents, commission_rate, commission_cents
        ) VALUES (
            NEW.tenant_id, NEW.id, NEW.professional_id,
            v_service_price, v_commission_rate, v_commission_cents
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on appointments
CREATE TRIGGER trigger_calculate_commission
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.calculate_appointment_commission();

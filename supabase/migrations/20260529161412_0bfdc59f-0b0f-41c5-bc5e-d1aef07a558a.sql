-- Ensure columns exist
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS recommendations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create professional_services junction table
CREATE TABLE IF NOT EXISTS public.professional_services (
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, service_id)
);

-- Enable RLS
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT ALL ON public.professional_services TO service_role;

-- Drop policy if exists to avoid error on retry
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated access to professional_services') THEN
        DROP POLICY "Allow authenticated access to professional_services" ON public.professional_services;
    END IF;
END $$;

CREATE POLICY "Allow authenticated access to professional_services" ON public.professional_services
FOR ALL TO authenticated USING (true);

-- Seed Professionals for Barbearia do João ('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56')
INSERT INTO public.professionals (id, tenant_id, name, role, photo_url, recommendations_count)
VALUES 
('d1a3e5b7-4c1d-4f1e-8a5b-9c8d7e6f5a4b', '7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Ricardo Silva', 'Barbeiro Master', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', 45),
('e2b4f6c8-5d2e-5a2f-9b6c-0d9e8f7a6b5c', '7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Felipe Oliveira', 'Especialista em Barba', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', 28)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    photo_url = EXCLUDED.photo_url,
    recommendations_count = EXCLUDED.recommendations_count;

-- Link Services to Professionals (Fixing ambiguity by using different variable names)
DO $$
DECLARE
    v_tenant_id UUID := '7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56';
    v_prof1_id UUID := 'd1a3e5b7-4c1d-4f1e-8a5b-9c8d7e6f5a4b';
    v_prof2_id UUID := 'e2b4f6c8-5d2e-5a2f-9b6c-0d9e8f7a6b5c';
    v_corte_id UUID;
    v_barba_id UUID;
    v_combo_id UUID;
BEGIN
    SELECT id INTO v_corte_id FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Corte Masculino' LIMIT 1;
    SELECT id INTO v_barba_id FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Barba Tradicional' LIMIT 1;
    SELECT id INTO v_combo_id FROM public.services WHERE tenant_id = v_tenant_id AND name = 'Combo: Corte + Barba' LIMIT 1;

    IF v_corte_id IS NOT NULL THEN
        INSERT INTO public.professional_services (professional_id, service_id) VALUES (v_prof1_id, v_corte_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_barba_id IS NOT NULL THEN
        INSERT INTO public.professional_services (professional_id, service_id) VALUES (v_prof1_id, v_barba_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.professional_services (professional_id, service_id) VALUES (v_prof2_id, v_barba_id) ON CONFLICT DO NOTHING;
    END IF;

    IF v_combo_id IS NOT NULL THEN
        INSERT INTO public.professional_services (professional_id, service_id) VALUES (v_prof1_id, v_combo_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.professional_services (professional_id, service_id) VALUES (v_prof2_id, v_combo_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;

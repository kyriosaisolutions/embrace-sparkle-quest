-- Update services table with new columns
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS price_cents INTEGER,
ADD COLUMN IF NOT EXISTS price_from BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_days INTEGER[], -- 0 (Sun) to 6 (Sat)
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Seed data for testing
-- Create a sample tenant
INSERT INTO public.tenants (id, name, slug, logo_url)
VALUES ('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Barbearia do João', 'barbearia-joao', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=128&h=128&fit=crop')
ON CONFLICT (slug) DO NOTHING;

-- Seed services for this tenant
INSERT INTO public.services (tenant_id, name, price, price_cents, price_from, duration_minutes, category, discount_percent, discount_days, image_url, sort_order)
VALUES 
('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Corte Masculino', 45.00, 4500, false, 45, 'Corte', 0, NULL, 'https://images.unsplash.com/photo-1621605815841-2179b7977491?w=400&h=300&fit=crop', 1),
('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Barba Tradicional', 35.00, 3500, false, 30, 'Barba', 10, '{2,3}', 'https://images.unsplash.com/photo-1599351431247-f132f03af0d6?w=400&h=300&fit=crop', 2),
('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Combo: Corte + Barba', 70.00, 7000, false, 75, 'Tratamento', 15, '{2,3,4}', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop', 0),
('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Luzes Inversas', 120.00, 12000, true, 120, 'Coloração', 0, NULL, 'https://images.unsplash.com/photo-1560869713-7d0a294308ed?w=400&h=300&fit=crop', 4),
('7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56', 'Hidratação Capilar', 50.00, 5000, false, 40, 'Tratamento', 0, NULL, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop', 3);

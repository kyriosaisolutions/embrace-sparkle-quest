-- Update tenants with more settings
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS cancellation_min_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS cancellation_fee_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_methods_local TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_facebook TEXT;

-- Update services with buffer and advanced promotion
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_start_date DATE,
ADD COLUMN IF NOT EXISTS discount_end_date DATE;

-- Update professionals with access and commission
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage', -- 'fixed' or 'percentage'
ADD COLUMN IF NOT EXISTS commission_value DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'professional', -- 'admin', 'manager', 'professional', 'receptionist'
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Table for individual professional working hours (override tenant defaults)
CREATE TABLE IF NOT EXISTS public.professional_working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for professional breaks/time off
CREATE TABLE IF NOT EXISTS public.professional_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.professional_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_breaks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_working_hours TO authenticated;
GRANT ALL ON public.professional_working_hours TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_breaks TO authenticated;
GRANT ALL ON public.professional_breaks TO service_role;

CREATE POLICY "Allow authenticated access to professional_working_hours" ON public.professional_working_hours FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to professional_breaks" ON public.professional_breaks FOR ALL TO authenticated USING (true);

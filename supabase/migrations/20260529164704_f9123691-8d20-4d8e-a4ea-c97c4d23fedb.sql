-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    recommended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add column to track reviews on appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT false;

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Basic policy
CREATE POLICY "Allow authenticated access to reviews" ON public.reviews
FOR ALL TO authenticated USING (true);

-- Function to update professional recommendation count
CREATE OR REPLACE FUNCTION public.update_professional_reputation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.recommended = true THEN
        UPDATE public.professionals 
        SET recommendations_count = recommendations_count + 1
        WHERE id = NEW.professional_id;
    END IF;
    
    UPDATE public.appointments 
    SET has_review = true 
    WHERE id = NEW.appointment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputations
CREATE TRIGGER trigger_update_professional_reputation
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_professional_reputation();

-- Create index for performance
CREATE INDEX idx_reviews_tenant ON public.reviews(tenant_id);
CREATE INDEX idx_reviews_professional ON public.reviews(professional_id);
CREATE INDEX idx_reviews_appointment ON public.reviews(appointment_id);

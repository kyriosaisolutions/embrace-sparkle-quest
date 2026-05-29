-- Update services table with deposit configuration
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deposit_percent INTEGER DEFAULT 0;

-- Update appointments table schema
ALTER TABLE public.appointments 
DROP COLUMN IF EXISTS start_time,
DROP COLUMN IF EXISTS end_time,
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
ADD COLUMN IF NOT EXISTS total_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT, -- pix, card, cash, in_person
ADD COLUMN IF NOT EXISTS protocol TEXT UNIQUE;

-- Create function to generate a unique protocol
CREATE OR REPLACE FUNCTION public.generate_protocol()
RETURNS TEXT AS $$
DECLARE
    new_protocol TEXT;
    done BOOLEAN := false;
BEGIN
    WHILE NOT done LOOP
        new_protocol := upper(substring(md5(random()::text) from 1 for 8));
        IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE protocol = new_protocol) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_protocol;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set protocol on insert if missing
CREATE OR REPLACE FUNCTION public.set_appointment_protocol()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.protocol IS NULL THEN
        NEW.protocol := public.generate_protocol();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_protocol
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointment_protocol();

-- Update seed data to include a service with deposit
UPDATE public.services 
SET deposit_percent = 20 
WHERE name = 'Combo: Corte + Barba';

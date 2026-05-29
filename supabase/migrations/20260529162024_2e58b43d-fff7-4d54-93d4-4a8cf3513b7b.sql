-- Update tenants table with working hours and slot configuration
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "1": {"open": "09:00", "close": "20:00", "closed": false},
  "2": {"open": "09:00", "close": "20:00", "closed": false},
  "3": {"open": "09:00", "close": "20:00", "closed": false},
  "4": {"open": "09:00", "close": "20:00", "closed": false},
  "5": {"open": "09:00", "close": "20:00", "closed": false},
  "6": {"open": "09:00", "close": "18:00", "closed": false},
  "0": {"open": "00:00", "close": "00:00", "closed": true}
}'::jsonb,
ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 30;

-- Update sample tenant seed data
UPDATE public.tenants 
SET working_hours = '{
  "1": {"open": "09:00", "close": "20:00", "closed": true},
  "2": {"open": "09:00", "close": "20:00", "closed": false},
  "3": {"open": "09:00", "close": "20:00", "closed": false},
  "4": {"open": "09:00", "close": "20:00", "closed": false},
  "5": {"open": "09:00", "close": "20:00", "closed": false},
  "6": {"open": "09:00", "close": "18:00", "closed": false},
  "0": {"open": "00:00", "close": "00:00", "closed": true}
}'::jsonb
WHERE slug = 'barbearia-joao';

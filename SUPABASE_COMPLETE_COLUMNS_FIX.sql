-- YOUR TYPE — safe missing-column patch for the current server code.
-- This only ADDS missing columns. It does not delete rows or change admin password.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS shipping numeric NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS free_shipping numeric NOT NULL DEFAULT 1999,
  ADD COLUMN IF NOT EXISTS gateway jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS courier jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Super Admin';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text NOT NULL DEFAULT '';

-- Refresh PostgREST's schema cache so newly added columns are visible immediately.
NOTIFY pgrst, 'reload schema';

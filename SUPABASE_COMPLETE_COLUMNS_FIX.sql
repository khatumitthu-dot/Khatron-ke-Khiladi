-- YOUR TYPE — safe missing-column patch for the current server code.
-- Run once in Supabase SQL Editor.
-- This only ADDS missing columns. It does not delete rows or change the admin password.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS shipping numeric NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS free_shipping numeric NOT NULL DEFAULT 1999,
  ADD COLUMN IF NOT EXISTS gateway jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS courier jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Super Admin';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS taxable_subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'New',
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS awb text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS courier text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tracking_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS order_date timestamptz;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS max_discount numeric NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';

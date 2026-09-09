-- Migration: admin_test_items
-- Purpose: Persistent checklist of manual test items for TJ and BG

CREATE TABLE IF NOT EXISTS public.admin_test_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    tested_by TEXT,
    notes TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_test_items_category ON public.admin_test_items(category);
CREATE INDEX IF NOT EXISTS idx_admin_test_items_completed ON public.admin_test_items(completed);
CREATE INDEX IF NOT EXISTS idx_admin_test_items_order ON public.admin_test_items(display_order);

-- Enable RLS
ALTER TABLE public.admin_test_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated admins and service role
CREATE POLICY "Allow admin read access on admin_test_items"
    ON public.admin_test_items
    FOR SELECT
    TO authenticated, service_role
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.admin_emails ae
            WHERE ae.email = auth.jwt() ->> 'email'
        )
    );

-- Allow insert/update/delete access to authenticated admins and service role
CREATE POLICY "Allow admin write access on admin_test_items"
    ON public.admin_test_items
    FOR ALL
    TO authenticated, service_role
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.admin_emails ae
            WHERE ae.email = auth.jwt() ->> 'email'
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.admin_emails ae
            WHERE ae.email = auth.jwt() ->> 'email'
        )
    );

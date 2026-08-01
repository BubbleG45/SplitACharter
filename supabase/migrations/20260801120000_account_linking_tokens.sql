-- Account linking tokens for merging SMS and Email authentication identities
CREATE TABLE IF NOT EXISTS public.account_linking_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash text NOT NULL UNIQUE,
    primary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secondary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    phone text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for rapid token lookup
CREATE INDEX IF NOT EXISTS idx_account_linking_tokens_hash ON public.account_linking_tokens(token_hash);

-- Enable RLS
ALTER TABLE public.account_linking_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to account_linking_tokens
CREATE POLICY "Service role manages account linking tokens"
    ON public.account_linking_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

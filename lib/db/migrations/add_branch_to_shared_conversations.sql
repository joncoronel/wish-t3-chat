-- Migration: Add branch-specific sharing support
-- Description: Adds branch_name column to shared_conversations table to allow sharing specific branches
-- Date: 2025-06-28

-- Add branch_name column to shared_conversations table
ALTER TABLE public.shared_conversations 
ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT 'main' NOT NULL;

-- Drop existing unique constraints
ALTER TABLE public.shared_conversations 
DROP CONSTRAINT IF EXISTS shared_conversations_conversation_id_key;

ALTER TABLE public.shared_conversations 
DROP CONSTRAINT IF EXISTS shared_conversations_share_token_key;

-- Create a new unique constraint that includes branch_name
-- This allows sharing different branches of the same conversation with different tokens
ALTER TABLE public.shared_conversations
ADD CONSTRAINT unique_conversation_branch_share UNIQUE (conversation_id, branch_name);

-- Ensure share_token is still unique globally (each branch gets its own token)
ALTER TABLE public.shared_conversations
ADD CONSTRAINT unique_share_token UNIQUE (share_token);

-- Create index for efficient lookups by share token
CREATE INDEX IF NOT EXISTS idx_shared_conversations_token 
ON public.shared_conversations(share_token);

-- Create index for efficient lookups by conversation and branch
CREATE INDEX IF NOT EXISTS idx_shared_conversations_conv_branch 
ON public.shared_conversations(conversation_id, branch_name);

-- Update existing shared conversations to explicitly use 'main' branch
UPDATE public.shared_conversations 
SET branch_name = 'main' 
WHERE branch_name IS NULL;

-- Add foreign key constraint to ensure branch exists
-- Note: This assumes conversation_branches table exists from previous migration
ALTER TABLE public.shared_conversations
ADD CONSTRAINT fk_shared_conversations_branch 
FOREIGN KEY (conversation_id, branch_name) 
REFERENCES public.conversation_branches(conversation_id, branch_name) 
ON DELETE CASCADE;
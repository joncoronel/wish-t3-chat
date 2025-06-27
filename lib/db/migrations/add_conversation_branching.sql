-- Migration: Add conversation branching support
-- Description: Adds support for conversation branching and alternative responses
-- Date: 2025-06-26

-- Add branch_name column to messages table for identifying different branches
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT 'main';

-- Create index for efficient branch queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_branch 
ON public.messages(conversation_id, branch_name, created_at);

-- Create index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_messages_parent_id 
ON public.messages(parent_id) WHERE parent_id IS NOT NULL;

-- Create conversation_branches table to track branch metadata
CREATE TABLE IF NOT EXISTS public.conversation_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    branch_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    created_from_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique branch names per conversation
    CONSTRAINT unique_conversation_branch_name UNIQUE (conversation_id, branch_name)
);

-- Create index for efficient branch queries
CREATE INDEX IF NOT EXISTS idx_conversation_branches_conversation_id 
ON public.conversation_branches(conversation_id);

-- Create index for active branch lookup
CREATE INDEX IF NOT EXISTS idx_conversation_branches_active 
ON public.conversation_branches(conversation_id, is_active) WHERE is_active = true;

-- Add RLS policies for conversation_branches table
ALTER TABLE public.conversation_branches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access branches for their own conversations
CREATE POLICY "Users can access their own conversation branches" ON public.conversation_branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = conversation_branches.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Create function to automatically update branch message count
CREATE OR REPLACE FUNCTION update_branch_message_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message count for the branch
    UPDATE public.conversation_branches 
    SET 
        message_count = (
            SELECT COUNT(*) 
            FROM public.messages 
            WHERE conversation_id = NEW.conversation_id 
            AND branch_name = NEW.branch_name
        ),
        updated_at = NOW()
    WHERE conversation_id = NEW.conversation_id 
    AND branch_name = NEW.branch_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update message count when messages are inserted/updated
DROP TRIGGER IF EXISTS trigger_update_branch_message_count ON public.messages;
CREATE TRIGGER trigger_update_branch_message_count
    AFTER INSERT OR UPDATE OF branch_name ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_message_count();

-- Create function to handle message deletion and update branch count
CREATE OR REPLACE FUNCTION handle_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message count for the branch
    UPDATE public.conversation_branches 
    SET 
        message_count = (
            SELECT COUNT(*) 
            FROM public.messages 
            WHERE conversation_id = OLD.conversation_id 
            AND branch_name = OLD.branch_name
        ),
        updated_at = NOW()
    WHERE conversation_id = OLD.conversation_id 
    AND branch_name = OLD.branch_name;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message deletion
DROP TRIGGER IF EXISTS trigger_handle_message_deletion ON public.messages;
CREATE TRIGGER trigger_handle_message_deletion
    AFTER DELETE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_deletion();

-- Create function to ensure only one active branch per conversation
CREATE OR REPLACE FUNCTION ensure_single_active_branch()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a branch as active, make all other branches in the conversation inactive
    IF NEW.is_active = true THEN
        UPDATE public.conversation_branches 
        SET is_active = false, updated_at = NOW()
        WHERE conversation_id = NEW.conversation_id 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single active branch
DROP TRIGGER IF EXISTS trigger_ensure_single_active_branch ON public.conversation_branches;
CREATE TRIGGER trigger_ensure_single_active_branch
    BEFORE INSERT OR UPDATE OF is_active ON public.conversation_branches
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_branch();

-- Populate default 'main' branches for existing conversations
INSERT INTO public.conversation_branches (conversation_id, branch_name, display_name, is_active, message_count)
SELECT 
    c.id as conversation_id,
    'main' as branch_name,
    'Main' as display_name,
    true as is_active,
    COALESCE(m.message_count, 0) as message_count
FROM public.conversations c
LEFT JOIN (
    SELECT 
        conversation_id, 
        COUNT(*) as message_count
    FROM public.messages 
    GROUP BY conversation_id
) m ON c.id = m.conversation_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.conversation_branches 
    WHERE conversation_id = c.id AND branch_name = 'main'
);

-- Update existing messages to have 'main' branch_name where it's null
UPDATE public.messages 
SET branch_name = 'main' 
WHERE branch_name IS NULL;

-- Add updated_at trigger for conversation_branches
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_branches_updated_at ON public.conversation_branches;
CREATE TRIGGER update_conversation_branches_updated_at
    BEFORE UPDATE ON public.conversation_branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
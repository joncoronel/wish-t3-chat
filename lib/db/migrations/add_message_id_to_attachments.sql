-- Add message_id column to attachments table with foreign key constraint
-- This will enable proper cascade deletion: conversations -> messages -> attachments

-- Add the column (nullable initially to handle existing data)
ALTER TABLE public.attachments
ADD COLUMN message_id UUID;

-- Add foreign key constraint with CASCADE DELETE
ALTER TABLE public.attachments
ADD CONSTRAINT fk_attachments_message_id
FOREIGN KEY (message_id)
REFERENCES public.messages(id)
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_attachments_message_id ON public.attachments(message_id);

-- Update Row Level Security policy to include message_id access
DROP POLICY IF EXISTS "Users can manage own attachments" ON public.attachments;

CREATE POLICY "Users can manage own attachments"
ON "public"."attachments"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  (( SELECT auth.uid() AS uid) = user_id) OR
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = attachments.message_id AND c.user_id = (( SELECT auth.uid() AS uid))
  )
)
WITH CHECK (
  (( SELECT auth.uid() AS uid) = user_id) OR
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = attachments.message_id AND c.user_id = (( SELECT auth.uid() AS uid))
  )
);

-- Note: Existing attachments will have message_id = NULL
-- They will need to be linked to messages manually or through data migration
-- For now, they'll still be accessible via the user_id relationship
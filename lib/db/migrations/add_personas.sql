-- Create personas table for AI conversation personas
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  avatar_url TEXT,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 8192,
  is_default BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create persona memories table for storing conversation summaries
CREATE TABLE IF NOT EXISTS public.persona_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_points JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add persona_id to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_default ON public.personas(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_persona_memories_persona_id ON public.persona_memories(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_memories_conversation_id ON public.persona_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona_id ON public.conversations(persona_id);

-- Create trigger for personas updated_at
CREATE TRIGGER handle_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for persona_memories updated_at
CREATE TRIGGER handle_persona_memories_updated_at
  BEFORE UPDATE ON public.persona_memories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_memories ENABLE ROW LEVEL SECURITY;

-- Personas RLS policies
CREATE POLICY "Users can view own personas" ON public.personas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas" ON public.personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas" ON public.personas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas" ON public.personas
  FOR DELETE USING (auth.uid() = user_id);

-- Persona memories RLS policies
CREATE POLICY "Users can view own persona memories" ON public.persona_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.personas 
      WHERE id = persona_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own persona memories" ON public.persona_memories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.personas 
      WHERE id = persona_id 
      AND user_id = auth.uid()
    )
  );

-- Function to ensure only one default persona per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_persona()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.personas 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one default persona
CREATE TRIGGER ensure_single_default_persona_trigger
  BEFORE INSERT OR UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_persona();
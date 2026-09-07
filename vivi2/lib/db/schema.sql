-- Supabase DDL for Vivi AI Companion App with pgvector Memory Support

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  theme_preference TEXT DEFAULT 'dark',
  language_preference TEXT DEFAULT 'mixed',
  memory_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personalities table
CREATE TABLE IF NOT EXISTS public.personalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Vivi',
  avatar_url TEXT DEFAULT '/vivi_avatar.jpg',
  tagline TEXT DEFAULT 'An AI personality shaped by her communication style, humour, interests and the conversations you''ve shared.',
  description TEXT DEFAULT 'AI representation modeled on a close German female friend''s communication style, witty banter, direct honesty, and shared context.',
  traits JSONB NOT NULL,
  communication JSONB NOT NULL,
  interests JSONB NOT NULL,
  examples JSONB NOT NULL,
  context JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id UUID NOT NULL REFERENCES public.personalities(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table with pgvector embedding
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id UUID REFERENCES public.personalities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('long_term', 'episodic', 'fact', 'preference')),
  importance INT DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Index for Cosine Similarity Search
CREATE INDEX IF NOT EXISTS memories_embedding_hnsw_idx 
ON public.memories USING hnsw (embedding vector_cosine_ops);

-- Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own personalities" ON public.personalities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own messages" ON public.messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own memories" ON public.memories FOR ALL USING (auth.uid() = user_id);

-- Cosine Distance Match Memories Function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  category text,
  importance int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.content,
    memories.category,
    memories.importance,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE memories.user_id = p_user_id
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

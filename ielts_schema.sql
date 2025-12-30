/** 
* Supabase Schema for IELTS Practice System
* 
* COPY AND PASTE THIS ENTIRE CONTENT INTO SUPABASE SQL EDITOR AND RUN IT.
**/

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  exam_type TEXT CHECK (exam_type IN ('Academic', 'General')),
  target_band NUMERIC(2,1),
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;


-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT CHECK (section IN ('Reading', 'Listening', 'Writing', 'Speaking')),
  question_type TEXT NOT NULL, 
  content JSONB NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Everyone can view questions' AND tablename = 'questions') THEN
        CREATE POLICY "Everyone can view questions" ON public.questions FOR SELECT USING (true);
    END IF;
END $$;
-- Note: Admin policy is omitted for brevity to avoid complexity if 'profiles' isn't populated yet. 
-- In a real app, you'd add:
-- CREATE POLICY "Only admins can modify" ON questions ...


-- 3. User Answers Table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  submitted_answer JSONB NOT NULL,
  is_correct BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for User Answers
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Users can view their own answers' AND tablename = 'user_answers') THEN
        CREATE POLICY "Users can view their own answers" ON public.user_answers FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Users can submit their own answers' AND tablename = 'user_answers') THEN
        CREATE POLICY "Users can submit their own answers" ON public.user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Initial Seed Data (Sample Questions)
INSERT INTO public.questions (section, question_type, content, options, correct_answer, explanation, difficulty)
VALUES 
(
  'Reading', 
  'MCQ', 
  '{"text": "What is the primary capital of Australia?", "passage": "Australia is a country..."}', 
  '["Sydney", "Melbourne", "Canberra", "Perth"]', 
  '"Canberra"', 
  'Canberra was selected as the capital in 1908.', 
  'Easy'
),
(
  'Listening',
  'GapFill',
  '{"text": "The lecture discusses the impact of ______ on marine life.", "audio_url": "https://example.com/audio.mp3"}',
  null,
  '"climate change"',
  'The speaker explicitly mentions "climate change affects marine ecosystems".',
  'Medium'
);

-- 5. User Management Trigger
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

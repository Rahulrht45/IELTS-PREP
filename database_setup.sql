-- ============================================
-- IELTS Reading Test Platform - Database Setup
-- ============================================

-- 1. Create Passages Table
CREATE TABLE IF NOT EXISTS passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    exam_type TEXT CHECK (exam_type IN ('Academic', 'General Training')),
    tags TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Passages
CREATE POLICY "Everyone can view passages"
    ON passages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert passages"
    ON passages FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own passages"
    ON passages FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own passages"
    ON passages FOR DELETE
    USING (auth.uid() = created_by);

-- 4. Add passage_id to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS passage_id UUID REFERENCES passages(id) ON DELETE CASCADE;

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_passages_difficulty ON passages(difficulty);
CREATE INDEX IF NOT EXISTS idx_passages_exam_type ON passages(exam_type);
CREATE INDEX IF NOT EXISTS idx_passages_created_at ON passages(created_at DESC);

-- 6. Create User Answers Table (for tracking student responses)
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN,
    time_spent INTEGER, -- in seconds
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 7. Enable RLS for User Answers
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for User Answers
CREATE POLICY "Users can view their own answers"
    ON user_answers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
    ON user_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
    ON user_answers FOR UPDATE
    USING (auth.uid() = user_id);

-- 9. Create Test Sessions Table (for tracking complete tests)
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    correct_answers INTEGER,
    score DECIMAL(5,2),
    time_taken INTEGER -- in seconds
);

-- 10. Enable RLS for Test Sessions
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies for Test Sessions
CREATE POLICY "Users can view their own test sessions"
    ON test_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test sessions"
    ON test_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions"
    ON test_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- 12. Create Indexes for Test Sessions
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_passage_id ON test_sessions(passage_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_completed_at ON test_sessions(completed_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('passages', 'user_answers', 'test_sessions');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('passages', 'questions', 'user_answers', 'test_sessions');

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a sample passage
INSERT INTO passages (title, content, word_count, difficulty, exam_type, tags)
VALUES (
    'The History of Coffee',
    'Coffee is one of the world''s most popular beverages, with over 400 billion cups consumed each year. The coffee plant, a shrub or tree, is believed to have originated in Ethiopia, where legend says a goat herder named Kaldi first discovered its energizing effects after noticing his goats became more energetic after eating the berries.

From Ethiopia, coffee spread to the Arabian Peninsula, where it was first cultivated in Yemen. By the 15th century, coffee was being grown in the Yemeni district of Arabia and by the 16th century, it was known in Persia, Egypt, Syria, and Turkey.',
    150,
    'Medium',
    'Academic',
    'history, culture, beverages'
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this message, your database setup is complete!
-- You can now use the Passage Manager and enhanced Admin Panel.

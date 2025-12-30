import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations

/**
 * Fetch all questions from a specific section
 * @param {string} section - 'Reading', 'Listening', 'Writing', or 'Speaking'
 * @returns {Promise<Array>} Array of questions
 */
export const getQuestionsBySection = async (section) => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('section', section);

    if (error) throw error;
    return data;
};

/**
 * Fetch questions by difficulty
 * @param {string} difficulty - 'Easy', 'Medium', or 'Hard'
 * @returns {Promise<Array>} Array of questions
 */
export const getQuestionsByDifficulty = async (difficulty) => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('difficulty', difficulty);

    if (error) throw error;
    return data;
};

/**
 * Submit a user's answer
 * @param {string} userId - User's UUID
 * @param {string} questionId - Question's UUID
 * @param {any} submittedAnswer - The answer submitted by the user
 * @param {boolean} isCorrect - Whether the answer is correct
 * @returns {Promise<Object>} The created answer record
 */
export const submitAnswer = async (userId, questionId, submittedAnswer, isCorrect) => {
    const { data, error } = await supabase
        .from('user_answers')
        .insert([
            {
                user_id: userId,
                question_id: questionId,
                submitted_answer: submittedAnswer,
                is_correct: isCorrect
            }
        ])
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * Get user's answer history
 * @param {string} userId - User's UUID
 * @returns {Promise<Array>} Array of user answers
 */
export const getUserAnswers = async (userId) => {
    const { data, error } = await supabase
        .from('user_answers')
        .select(`
      *,
      questions (
        section,
        question_type,
        difficulty
      )
    `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get user profile
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update user profile
 * @param {string} userId - User's UUID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * Get user statistics
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async (userId) => {
    const { data, error } = await supabase
        .from('user_answers')
        .select('is_correct, questions(section, difficulty)')
        .eq('user_id', userId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
        total: data.length,
        correct: data.filter(a => a.is_correct).length,
        incorrect: data.filter(a => a.is_correct === false).length,
        accuracy: data.length > 0 ? (data.filter(a => a.is_correct).length / data.length * 100).toFixed(1) : 0,
        bySection: {},
        byDifficulty: {}
    };

    // Group by section
    data.forEach(answer => {
        const section = answer.questions?.section;
        if (section) {
            if (!stats.bySection[section]) {
                stats.bySection[section] = { total: 0, correct: 0 };
            }
            stats.bySection[section].total++;
            if (answer.is_correct) stats.bySection[section].correct++;
        }
    });

    // Group by difficulty
    data.forEach(answer => {
        const difficulty = answer.questions?.difficulty;
        if (difficulty) {
            if (!stats.byDifficulty[difficulty]) {
                stats.byDifficulty[difficulty] = { total: 0, correct: 0 };
            }
            stats.byDifficulty[difficulty].total++;
            if (answer.is_correct) stats.byDifficulty[difficulty].correct++;
        }
    });

    return stats;
};

export default supabase;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import './PracticeTest.css';

const PracticeTest = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userAnswer, setUserAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, explanation: string }

    useEffect(() => {
        fetchQuestion();
    }, [id]);

    const fetchQuestion = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setQuestion(data);
        } catch (error) {
            console.error('Error fetching question:', error);
            // Optionally redirect back if not found
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!userAnswer) return;
        setSubmitting(true);

        try {
            // Check correctness
            // Note: In a real secure app, grading might happen on the server (Edge Function) 
            // to hide correct answers from the client. For this demo, we check locally or fetch.
            // Since 'correct_answer' is selected in fetchQuestion, checking locally:

            const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correct_answer) ||
                (typeof userAnswer === 'string' && userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim());

            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                await supabase.from('user_answers').insert({
                    user_id: user.id,
                    question_id: question.id,
                    submitted_answer: userAnswer,
                    is_correct: isCorrect
                });
            } else {
                // If not logged in, maybe just show result? 
                // Or force login. For now, we allow practice without saving if public.
            }

            setFeedback({
                isCorrect,
                explanation: question.explanation
            });

        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Failed to submit answer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="practice-test-container">Loading...</div>;
    if (!question) return <div className="practice-test-container">Question not found.</div>;

    const renderInput = () => {
        if (question.question_type === 'MCQ' && question.options) {
            return (
                <div className="options-list">
                    {question.options.map((opt, idx) => (
                        <div
                            key={idx}
                            className={`option-item ${userAnswer === opt ? 'selected' : ''}`}
                            onClick={() => !feedback && setUserAnswer(opt)}
                        >
                            <div className="radio-circle"></div>
                            <span>{opt}</span>
                        </div>
                    ))}
                </div>
            );
        } else {
            // Default text input (GapFill, etc.)
            return (
                <input
                    type="text"
                    className="text-input"
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={!!feedback}
                />
            );
        }
    };

    return (
        <div className="practice-test-container">
            <header className="test-header">
                <button onClick={() => navigate('/practice')} className="back-btn">
                    ← Back to Library
                </button>
                <div className="test-meta">
                    <span className="q-tag">{question.section}</span>
                    <span className="q-type-label"> | {question.question_type}</span>
                </div>
            </header>

            <div className={`test-split-layout ${!question.content.passage && !question.content.audio_url ? 'single-col' : ''}`}>

                {/* Left Side: Resource (Passage / Audio) */}
                {(question.content.passage || question.content.audio_url) && (
                    <div className="context-panel">
                        <span className="context-label">
                            {question.section === 'Listening' ? 'Audio Track' : 'Read the Passage'}
                        </span>

                        {question.content.audio_url && (
                            <audio controls src={question.content.audio_url} style={{ width: '100%', marginBottom: '1rem' }}>
                                Your browser does not support the audio element.
                            </audio>
                        )}

                        {question.content.passage && (
                            <div className="passage-text">
                                {question.content.passage}
                            </div>
                        )}
                    </div>
                )}

                {/* Right Side: Question */}
                <div className="question-panel">
                    <div className="question-card">
                        <h2 className="question-text">{question.content.text}</h2>

                        {renderInput()}

                        {!feedback && (
                            <div className="test-actions">
                                <button
                                    className="submit-btn"
                                    onClick={handleSubmit}
                                    disabled={!userAnswer || submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Answer'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Feedback Section */}
                    {feedback && (
                        <div className={`feedback-box ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                            <div className="feedback-title">
                                <span>{feedback.isCorrect ? '✅ Correct' : '❌ Incorrect'}</span>
                            </div>
                            <p><strong>Correct Answer:</strong> {String(question.correct_answer)}</p>
                            {feedback.explanation && (
                                <div className="explanation">
                                    <strong>Explanation:</strong> {feedback.explanation}
                                </div>
                            )}
                            <button className="submit-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/practice')}>
                                Back to Library →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PracticeTest;

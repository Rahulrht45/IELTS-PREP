import React, { useState, useEffect } from 'react';
import {
    getQuestionsBySection,
    submitAnswer,
    getUserStats
} from '../config/supabaseClient';
import './SupabaseExample.css';

/**
 * Example component demonstrating Supabase integration
 * This shows how to fetch questions and submit answers
 */
const SupabaseExample = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSection, setSelectedSection] = useState('Reading');
    const [stats, setStats] = useState(null);

    // Fetch questions when section changes
    useEffect(() => {
        fetchQuestions();
    }, [selectedSection]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getQuestionsBySection(selectedSection);
            setQuestions(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async (questionId, answer, isCorrect) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Please sign in to save your answers properly.');
                return;
            }

            await submitAnswer(user.id, questionId, answer, isCorrect);
            alert('Answer submitted successfully!');
        } catch (err) {
            alert('Error submitting answer: ' + err.message);
            console.error('Error submitting answer:', err);
        }
    };

    const loadUserStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please sign in to view stats.");
                return;
            }
            const userStats = await getUserStats(user.id);
            setStats(userStats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    return (
        <div className="supabase-example">
            <div className="example-header">
                <h1>🎯 Supabase Integration Example</h1>
                <p>Connected to IELTS PREP Database</p>
            </div>

            {/* Section Selector */}
            <div className="section-selector">
                <h2>Select Section:</h2>
                <div className="section-buttons">
                    {['Reading', 'Listening', 'Writing', 'Speaking'].map(section => (
                        <button
                            key={section}
                            className={`section-btn ${selectedSection === section ? 'active' : ''}`}
                            onClick={() => setSelectedSection(section)}
                        >
                            {section}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading questions...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="error-message">
                    <h3>⚠️ Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchQuestions}>Try Again</button>
                </div>
            )}

            {/* Questions Display */}
            {!loading && !error && (
                <div className="questions-container">
                    <h2>{selectedSection} Questions ({questions.length})</h2>

                    {questions.length === 0 ? (
                        <div className="no-questions">
                            <p>No questions available for this section yet.</p>
                            <p>Add questions through the Supabase dashboard or admin panel.</p>
                        </div>
                    ) : (
                        <div className="questions-list">
                            {questions.map((question, index) => (
                                <div key={question.id} className="question-card">
                                    <div className="question-header">
                                        <span className="question-number">Question {index + 1}</span>
                                        <span className={`difficulty-badge ${question.difficulty?.toLowerCase()}`}>
                                            {question.difficulty}
                                        </span>
                                    </div>

                                    <div className="question-content">
                                        <h3>{question.question_type}</h3>
                                        <p>{question.content?.text}</p>

                                        {question.options && (
                                            <div className="options">
                                                {question.options.map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        className="option-btn"
                                                        onClick={() => {
                                                            const isCorrect = option === question.correct_answer;
                                                            handleAnswerSubmit(question.id, option, isCorrect);
                                                        }}
                                                    >
                                                        {String.fromCharCode(65 + idx)}. {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {question.explanation && (
                                        <details className="explanation">
                                            <summary>💡 Explanation</summary>
                                            <p>{question.explanation}</p>
                                            <p><strong>Correct Answer:</strong> {question.correct_answer}</p>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Stats Section */}
            <div className="stats-section">
                <button onClick={loadUserStats} className="load-stats-btn">
                    📊 Load My Statistics
                </button>

                {stats && (
                    <div className="stats-display">
                        <h3>Your Performance</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Total Answered</span>
                                <span className="stat-value">{stats.total}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Correct</span>
                                <span className="stat-value correct">{stats.correct}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Incorrect</span>
                                <span className="stat-value incorrect">{stats.incorrect}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Accuracy</span>
                                <span className="stat-value">{stats.accuracy}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Database Info */}
            <div className="database-info">
                <h3>📦 Database Connection Details</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <strong>Project:</strong> IELTS PREP
                    </div>
                    <div className="info-item">
                        <strong>Project ID:</strong> ksapvoxhcnchirxhjlbt
                    </div>
                    <div className="info-item">
                        <strong>Tables:</strong> profiles, questions, user_answers
                    </div>
                    <div className="info-item">
                        <strong>Status:</strong> <span className="status-connected">✓ Connected</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupabaseExample;

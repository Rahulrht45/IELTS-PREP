import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import './Practice.css';

const Practice = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*');

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError(error.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const filteredQuestions = filter === 'All'
        ? questions
        : questions.filter(q => q.section === filter);

    return (
        <div className="practice-container">
            <header className="practice-header">
                <h1>IELTS Practice Library</h1>
                <p>Select a skill to start practicing</p>
                <div className="skill-filters">
                    {['All', 'Reading', 'Listening', 'Writing', 'Speaking'].map(skill => (
                        <button
                            key={skill}
                            className={`skill-btn ${filter === skill ? 'active' : ''}`}
                            onClick={() => setFilter(skill)}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </header>

            <div className="practice-library-body">
                {error && (
                    <div className="error-message">
                        <h3>Error Loading Content</h3>
                        <p>{error}</p>
                        <button onClick={fetchQuestions}>Try Again</button>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">Loading library...</div>
                ) : (
                    <div className="category-list">
                        {(() => {
                            // Filter and Group Logic
                            const relevantQuestions = filter === 'All'
                                ? questions
                                : questions.filter(q => q.section === filter);

                            if (relevantQuestions.length === 0) {
                                return (
                                    <div className="empty-state">
                                        <p>No questions found for {filter}. Check back later!</p>
                                    </div>
                                );
                            }

                            // If 'All', show simple grid or maybe group by Section? 
                            // For simplicity, if 'All', we just show them. 
                            // If Filter is selected, we group by Category.

                            if (filter === 'All') {
                                return (
                                    <div className="questions-grid">
                                        {relevantQuestions.map(q => (
                                            <QuestionCard key={q.id} question={q} navigate={navigate} />
                                        ))}
                                    </div>
                                );
                            }

                            // Group by Category
                            const groups = relevantQuestions.reduce((acc, q) => {
                                const cat = q.content?.category || 'General';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(q);
                                return acc;
                            }, {});

                            return Object.entries(groups).map(([category, groupQs]) => (
                                <div key={category} className="category-section">
                                    <h2 className="category-heading">{category}</h2>
                                    <div className="questions-grid">
                                        {groupQs.map(q => (
                                            <QuestionCard key={q.id} question={q} navigate={navigate} />
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

// Extracted Card Component for cleaner code
const QuestionCard = ({ question, navigate }) => {
    const topic = question.content?.topic;
    return (
        <div className="question-card">
            <div className="card-header">
                <span className={`q-tag ${(question.section || 'default').toLowerCase()}`}>
                    {question.section || 'General'}
                </span>
                {topic && <span className="topic-badge">{topic}</span>}
            </div>

            <h3 className="q-preview">
                {question.content?.text?.length > 60
                    ? question.content.text.substring(0, 60) + '...'
                    : question.content?.text || "Question Content"}
            </h3>

            <div className="q-footer">
                <span className="q-type-label">{question.question_type}</span>
                <button
                    className="start-btn"
                    onClick={() => navigate(`/practice/${question.id}`)}
                >
                    Start
                </button>
            </div>
        </div>
    );
};

export default Practice;

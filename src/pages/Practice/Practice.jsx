import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import './Practice.css';

const Practice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize filters from location state if redirected from Dashboard
    const [filter, setFilter] = useState(location.state?.filter || 'All');
    const [catFilter, setCatFilter] = useState(location.state?.catFilter || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

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
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError(error.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

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
                            onClick={() => {
                                setFilter(skill);
                                setCatFilter(null);
                            }}
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
                    <div className="loading-state">
                        <div className="loader-neon"></div>
                        <p>Loading library...</p>
                    </div>
                ) : (
                    <div className="category-list">
                        {(() => {
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

                            // Professional List View for Category
                            if (catFilter) {
                                const topicMatchQuestions = relevantQuestions.filter(q => {
                                    const qCat = (q.content?.category || '').toLowerCase();
                                    const qType = (q.question_type || '').toLowerCase();
                                    const target = catFilter.toLowerCase();

                                    // Smart Match Logic
                                    const isMCQMatch = (target.includes('choice') || target === 'mcq') && (qCat.includes('choice') || qType === 'mcq');
                                    const isTFMatch = (target.includes('true') || target.includes('false') || target === 't/f/ng') && (qCat.includes('true') || qCat.includes('false') || qType === 't/f/ng');
                                    const isCompMatch = (target.includes('completion') || target.includes('gap')) && (qCat.includes('completion') || qType.includes('gap') || qType.includes('fill'));

                                    const isMatch = qCat.includes(target) || qType === target || isMCQMatch || isTFMatch || isCompMatch;

                                    return isMatch &&
                                        ((q.content?.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            q.id.toLowerCase().includes(searchQuery.toLowerCase()));
                                });

                                return (
                                    <div className="professional-list-container">
                                        <div className="list-top-meta">
                                            <div className="title-with-badge">
                                                <div className={`skill-circle-badge ${filter.toLowerCase() == 'all' ? 'reading' : filter.toLowerCase()}`}>
                                                    <span>{filter === 'All' ? 'A' : filter.charAt(0)}</span>
                                                </div>
                                                <div className="dropdown-title-wrapper">
                                                    <h2 className="main-list-title-header">{catFilter}</h2>
                                                </div>
                                            </div>
                                            <div className="header-actions">
                                                <button className="reset-practice-btn" onClick={() => { setCatFilter(null); navigate('/practice'); }}>Exit Category</button>
                                                <button className="download-btn">Download PDF</button>
                                            </div>
                                        </div>

                                        <div className="list-controls-bar">
                                            <div className="status-checks">
                                                <label className="custom-check">
                                                    <input type="checkbox" defaultChecked />
                                                    All
                                                </label>
                                                <label className="custom-check">
                                                    <input type="checkbox" />
                                                    Not Practiced
                                                </label>
                                            </div>
                                            <div className="search-group">
                                                <div className="search-input-wrapper premium-glass">
                                                    <input
                                                        type="text"
                                                        placeholder={`Search inside ${catFilter}...`}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                    <button className="search-neon-btn">🔍</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="list-tabs-row">
                                            <div className="tabs-group">
                                                <span className="tab active">Standard</span>
                                                <span className="tab">Recent Exam</span>
                                                <span className="tab">Bookmarks</span>
                                            </div>
                                            <div className="list-stats">
                                                <span className="results-count">
                                                    {topicMatchQuestions.length} Found
                                                </span>
                                            </div>
                                        </div>

                                        <div className="professional-list">
                                            {topicMatchQuestions.length > 0 ? (
                                                topicMatchQuestions.map(q => (
                                                    <QuestionListItem
                                                        key={q.id}
                                                        question={q}
                                                        navigate={navigate}
                                                        isExpanded={expandedId === q.id}
                                                        onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="empty-state">
                                                    <p>No <strong>{catFilter}</strong> questions found in {filter} section.</p>
                                                    <button className="clear-cat-btn" onClick={() => { setCatFilter(null); setSearchQuery(''); }}>Back to Overview</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="list-footer-info-bar">
                                            <span className="info-text">
                                                {catFilter.toLowerCase().includes('true') || catFilter.toLowerCase().includes('false') ? (
                                                    <span><strong>Pro Hint:</strong> Match the meaning, not just words. IF THE PASSAGE CONTRADICTS, IT'S FALSE.</span>
                                                ) : catFilter.toLowerCase().includes('choice') ? (
                                                    <span><strong>Pro Hint:</strong> Elimination is your best friend. Look for synonyms in the passage.</span>
                                                ) : (
                                                    <span>Master the techniques for <strong>{catFilter}</strong></span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="list-footer-exit">
                                            <button className="exit-cat-btn" onClick={() => setCatFilter(null)}>
                                                ✕ Close {catFilter}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // Skill View (Clickable Categories)
                            const groups = relevantQuestions.reduce((acc, q) => {
                                let cat = q.content?.category;
                                const qType = (q.question_type || '').toUpperCase();

                                if (!cat) {
                                    if (qType === 'MCQ') cat = 'Multiple Choice';
                                    else if (qType === 'T/F/NG' || qType === 'Y/N/NG') cat = 'True/False Assessment';
                                    else if (qType.includes('GAP') || qType.includes('FILL')) cat = 'Completion Tasks';
                                    else cat = 'General Practice';
                                }

                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(q);
                                return acc;
                            }, {});

                            return Object.entries(groups).map(([category, groupQs]) => (
                                <div
                                    key={category}
                                    className="category-section clickable"
                                    onClick={(e) => {
                                        if (e.target.closest('.start-btn')) return;
                                        setCatFilter(category);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <h2 className="category-heading">{category} <span>({groupQs.length} Questions) →</span></h2>
                                    <div className="questions-grid preview">
                                        {groupQs.slice(0, 3).map(q => (
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

const QuestionListItem = ({ question, navigate, isExpanded, onToggle }) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const shortId = (question.id || '00000000').substring(0, 8);
    const difficultyText = (question.difficulty || 'Medium').toLowerCase();

    const diffClass = difficultyText === 'simple' || difficultyText === 'easy' ? 'easy' :
        difficultyText === 'difficult' || difficultyText === 'hard' ? 'difficult' : 'medium';

    return (
        <div className={`pro-list-item ${isExpanded ? 'active' : ''}`}>
            <div className="item-main-row" onClick={onToggle}>
                <span className="item-id">#{shortId}</span>
                <span className="item-title">
                    {question.content?.topic || question.content?.text?.substring(0, 60) + '...'}
                </span>

                <div className="item-badges">
                    <span className={`difficulty-pill ${diffClass}`}>
                        <span className="dot"></span> {question.difficulty || 'Medium'}
                    </span>
                    <span className="status-tag">New</span>
                    <span className="appeared-badge">Appeared (0)</span>
                    <span
                        className={`bookmark-icon ${isBookmarked ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBookmarked(!isBookmarked);
                        }}
                    >
                        🔖
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="item-expanded-content">
                    <div className="expanded-inner">
                        <div className="preview-box">
                            <p>{question.content?.text || "Below is a text with blanks. Click on each blank to select the correct answer from the dropdown menu..."}</p>
                        </div>
                        <button
                            className="start-neon-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/practice/${question.id}`);
                            }}
                        >
                            Start Practice
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

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
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/practice/${question.id}`);
                    }}
                >
                    Start
                </button>
            </div>
        </div>
    );
};

export default Practice;

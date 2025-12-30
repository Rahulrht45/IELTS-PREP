import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { getDemoQuestionById, getAllDemoQuestions } from '../../data/demoQuestions';
import './PracticeTest.css';

const STRATEGIES = {
    'MCQ': {
        title: 'Multiple Choice Strategy',
        steps: [
            'Scan the passage for keywords from the question before looking at options.',
            'Eliminate obviously wrong answers first.',
            'Watch out for "distractors" – options that use words from the passage but have a different meaning.'
        ],
        hint: 'Context is king. If two options seem similar, check the surrounding sentences in the passage.'
    },
    'T/F/NG': {
        title: 'True/False/Not Given Strategy',
        steps: [
            'TRUE: The message in the passage is the SAME as the statement.',
            'FALSE: The message in the passage is the OPPOSITE of the statement.',
            'NOT GIVEN: The information is not mentioned or the author\'s opinion isn\'t clear.'
        ],
        hint: 'Never assume! If it\'s not explicitly in the text, it\'s Not Given.'
    },
    'Y/N/NG': {
        title: 'Yes/No/Not Given Strategy',
        steps: [
            'Similar to T/F/NG, but focuses on the writer\'s opinions rather than facts.',
            'Identifying synonyms is key.'
        ],
        hint: 'Focus on the author\'s tone and stance.'
    },
    'GapFill': {
        title: 'Sentence Completion Strategy',
        steps: [
            'Identify the part of speech needed (noun, verb, adjective).',
            'Check the word limit (e.g., "NO MORE THAN TWO WORDS").',
            'Find the relevant section in the passage using scanning techniques.'
        ],
        hint: 'The word must be exactly as it appears in the passage.'
    },
    'Essay': {
        title: 'Essay Writing Strategy',
        steps: [
            'Spend 5 minutes planning your essay structure.',
            'Write a clear introduction with your thesis statement.',
            'Develop 2-3 body paragraphs with examples and explanations.',
            'Write a conclusion that summarizes your main points.'
        ],
        hint: 'Aim for 250-280 words. Quality over quantity - focus on coherence and cohesion.'
    },
    'Letter': {
        title: 'Letter Writing Strategy',
        steps: [
            'Identify if it\'s formal or informal based on the recipient.',
            'Use appropriate greeting and closing.',
            'Address all bullet points in the task.',
            'Maintain consistent tone throughout.'
        ],
        hint: 'For formal letters, use "Dear Sir/Madam" and "Yours faithfully". For informal, use first names.'
    },
    'Part1': {
        title: 'Speaking Part 1 Strategy',
        steps: [
            'Give direct answers followed by additional details.',
            'Use a variety of vocabulary and grammar structures.',
            'Speak naturally - don\'t memorize answers.',
            'Extend your answers to 2-3 sentences.'
        ],
        hint: 'This part tests your ability to communicate opinions and information on everyday topics.'
    },
    'Part2': {
        title: 'Speaking Part 2 Strategy',
        steps: [
            'Use the 1-minute preparation time to make brief notes.',
            'Cover all points on the task card.',
            'Speak for the full 1-2 minutes.',
            'Use linking words to connect your ideas.'
        ],
        hint: 'If you run out of things to say, elaborate on one of the points with more detail or examples.'
    },
    'Part3': {
        title: 'Speaking Part 3 Strategy',
        steps: [
            'Give extended answers with explanations and examples.',
            'Discuss both sides of an issue if relevant.',
            'Use more sophisticated vocabulary and complex sentences.',
            'It\'s okay to take a moment to think before answering.'
        ],
        hint: 'This part tests your ability to express and justify opinions and analyze abstract topics.'
    },
    'Matching': {
        title: 'Matching Features/Headings Strategy',
        steps: [
            'Read the list of options (A, B, C...) first to understand the categories.',
            'Scan the text for names, dates, or key terms found in the questions.',
            'Read the sentence containing the keyword carefully.',
            'Don\'t just look for word matches; look for synonyms and paraphrasing.'
        ],
        hint: 'You can use some options more than once if the instructions say "You may use any letter more than once".'
    },
    'ShortAnswer': {
        title: 'Short Answer Strategy',
        steps: [
            'Check the word limit strictly (e.g., "NO MORE THAN TWO WORDS").',
            'Identify the type of information needed (number, name, place, etc.).',
            'Scan the text to locate the relevant information.',
            'Copy the words EXACTLY as they appear in the text.'
        ],
        hint: 'Hyphenated words count as one word. Numbers can be written as figures or words.'
    }
};

const SmartText = ({ text, onLookup }) => {
    if (!text) return null;
    const tokens = text.split(/(\s+)/);
    return (
        <>
            {tokens.map((token, i) => {
                if (/\s+/.test(token)) return <span key={i}>{token}</span>;
                const match = token.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);
                if (match) {
                    const [_, pre, word, post] = match;
                    return (
                        <span key={i}>
                            {pre}
                            <span
                                className="live-word"
                                onClick={(e) => onLookup(word, e)}
                            >
                                {word}
                            </span>
                            {post}
                        </span>
                    );
                }
                return <span key={i}>{token}</span>;
            })}
        </>
    );
};

const PracticeTest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Side Drawer States
    const [isDrawerOpen, setIsDrawerOpen] = useState(location.state?.openDrawer || false);
    const [drawerQuestions, setDrawerQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [skillFilter] = useState(location.state?.skillFilter || 'Reading');
    const [categoryTitle] = useState(location.state?.categoryTitle || 'Multiple Choice');

    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userAnswer, setUserAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showStrategy, setShowStrategy] = useState(true);

    // Vocab Context Menu State
    const [vocabMenu, setVocabMenu] = useState(null); // { x, y, word }
    const [vocabDefinition, setVocabDefinition] = useState(null);
    const [savingVocab, setSavingVocab] = useState(false);

    useEffect(() => {
        fetchQuestion();
        fetchDrawerQuestions();

        // Cleanup function to stop TTS when component unmounts or question changes
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            // Remove global click handler for clearing vocab menu
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [id]);

    const handleGlobalClick = (e) => {
        if (!e.target.closest('.vocab-context-menu') && !e.target.closest('.live-word')) {
            setVocabMenu(null);
            setVocabDefinition(null);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    const fetchQuestion = async () => {
        setLoading(true);
        setFeedback(null);
        setUserAnswer('');
        try {
            // Try to fetch from database first
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null) // Only fetch non-deleted questions
                .single();

            if (error || !data) {
                // If database query fails or returns nothing, use demo question
                const demoQuestion = getDemoQuestionById(id);
                if (demoQuestion) {
                    setQuestion(demoQuestion);
                } else {
                    throw new Error('Question not found');
                }
            } else {
                setQuestion(data);
            }
        } catch (error) {
            console.error('Error fetching question:', error);
            // Try to load a demo question as final fallback
            const demoQuestion = getDemoQuestionById(id);
            if (demoQuestion) {
                setQuestion(demoQuestion);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDrawerQuestions = async () => {
        try {
            // Fetch questions of the same skill to populate the side drawer
            let query = supabase
                .from('questions')
                .select('id, content, question_type, difficulty, section')
                .is('deleted_at', null); // Only show non-deleted questions

            // Apply filters if we came from a specific category
            if (skillFilter && skillFilter !== 'All') {
                query = query.eq('section', skillFilter);
            }

            const { data } = await query.limit(20);

            let allQuestions = [];

            // Add database questions if available
            if (data && data.length > 0) {
                const formatted = data.map(q => ({
                    id: q.id,
                    shortId: '#' + q.id.substring(0, 8),
                    title: q.content?.topic || q.content?.text?.substring(0, 30) + '...',
                    diff: q.difficulty || 'Medium',
                    app: 'Appeared (0)'
                }));
                allQuestions = [...formatted];
            }

            // Add demo questions
            const demoQuestions = getAllDemoQuestions();
            const filteredDemoQuestions = skillFilter && skillFilter !== 'All'
                ? demoQuestions.filter(q => q.section === skillFilter)
                : demoQuestions;

            const formattedDemoQuestions = filteredDemoQuestions.map(q => ({
                id: q.id,
                shortId: '#' + q.id.substring(0, 12),
                title: q.content?.text?.substring(0, 40) + '...' || 'Demo Question',
                diff: q.difficulty || 'Medium',
                app: 'Demo'
            }));

            allQuestions = [...allQuestions, ...formattedDemoQuestions];
            setDrawerQuestions(allQuestions);
        } catch (err) {
            console.error("Drawer fetch error:", err);
            // If error, just use demo questions
            const demoQuestions = getAllDemoQuestions();
            const filteredDemoQuestions = skillFilter && skillFilter !== 'All'
                ? demoQuestions.filter(q => q.section === skillFilter)
                : demoQuestions;

            const formattedDemoQuestions = filteredDemoQuestions.map(q => ({
                id: q.id,
                shortId: '#' + q.id.substring(0, 12),
                title: q.content?.text?.substring(0, 40) + '...' || 'Demo Question',
                diff: q.difficulty || 'Medium',
                app: 'Demo'
            }));

            setDrawerQuestions(formattedDemoQuestions);
        }
    };

    useEffect(() => {
        // Initialize filtered questions whenever drawer questions change
        setFilteredQuestions(drawerQuestions);
    }, [drawerQuestions]);

    const handlePlayTTS = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = question.content.passage || question.content.text;
            if (text) {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'en-GB';
                u.rate = 0.9;
                window.speechSynthesis.speak(u);
            }
        } else {
            alert("Text-to-Speech is not supported in this browser.");
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Reset practice session and return to library view
    const handleResetPractice = () => {
        // Navigate back to the main practice library without preserving state
        navigate('/practice', { replace: true });
        // Close the side drawer if open
        setIsDrawerOpen(false);
    };

    // Handle search functionality
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (!val.trim()) {
            setFilteredQuestions(drawerQuestions);
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setFilteredQuestions(drawerQuestions);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = drawerQuestions.filter(q => {
            const matchesId = q.shortId.toLowerCase().includes(query);
            const matchesTitle = q.title.toLowerCase().includes(query);
            const matchesNumber = q.id.toLowerCase().includes(query);
            return matchesId || matchesTitle || matchesNumber;
        });

        setFilteredQuestions(filtered);
    };



    const handleWordLookup = (word, e) => {
        e.stopPropagation(); // Prevent global click from immediately closing it
        const rect = e.target.getBoundingClientRect();
        setVocabMenu({
            x: rect.left + window.scrollX + (rect.width / 2),
            y: rect.top + window.scrollY - 10,
            word: word
        });
        fetchDefinition(word);
    };

    // --- Vocab Feature Logic ---
    const handleTextSelection = async (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        // Basic check for a single word (no spaces, length > 1)
        if (text && text.length > 1 && !text.includes(' ') && /^[a-zA-Z]+$/.test(text)) {
            // Get coordinates
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Set menu position just above the word
            setVocabMenu({
                x: rect.left + window.scrollX + (rect.width / 2),
                y: rect.top + window.scrollY - 10,
                word: text
            });

            // Auto-fetch definition (simple mock or free API)
            fetchDefinition(text);
        }
    };

    const fetchDefinition = async (word) => {
        setVocabDefinition({ loading: true });
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const meaning = data[0].meanings[0];
                setVocabDefinition({
                    word: data[0].word,
                    type: meaning.partOfSpeech,
                    definition: meaning.definitions[0].definition,
                    example: meaning.definitions[0].example || "No example available."
                });
            } else {
                setVocabDefinition({ error: "Definition not found." });
            }
        } catch (err) {
            console.error("Dict API Error", err);
            setVocabDefinition({ error: "Could not fetch definition." });
        }
    };

    const saveToVocabBank = async () => {
        if (!vocabDefinition || vocabDefinition.error || !vocabDefinition.word) return;

        setSavingVocab(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to save vocabulary.");
                return;
            }

            const { error } = await supabase.from('user_vocab').insert({
                user_id: user.id,
                word: vocabDefinition.word,
                type: vocabDefinition.type,
                definition: vocabDefinition.definition,
                example: vocabDefinition.example
            });

            if (error) throw error;

            // Show success briefly or just close
            setVocabMenu(null); // Close menu
        } catch (err) {
            console.error("Save Vocab Error", err);
            alert("Failed to save word.");
        } finally {
            setSavingVocab(false);
        }
    };

    const handleSubmit = async () => {
        if (!userAnswer) return;
        setSubmitting(true);

        try {
            const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correct_answer) ||
                (typeof userAnswer === 'string' && userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim());

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                await supabase.from('user_answers').insert({
                    user_id: user.id,
                    question_id: question.id,
                    submitted_answer: userAnswer,
                    is_correct: isCorrect
                });
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

    if (loading) return (
        <div className="practice-test-container loading">
            <div className="loader-neon"></div>
            <p>Gathering test materials...</p>
        </div>
    );

    if (!question) return (
        <div className="practice-test-container">
            <div className="error-card">
                <h2>Question not found</h2>
                <button onClick={() => navigate('/practice')} className="primary-btn">Back to Library</button>
            </div>
        </div>
    );

    const renderInput = () => {
        const qType = question.question_type?.toUpperCase() || '';
        const lowerText = (question.content?.text || '').toLowerCase();

        const isTFNG = qType.includes('T/F/NG') || qType.includes('TRUE/FALSE') || /true.*false/i.test(lowerText);
        const isYNNG = qType.includes('Y/N/NG') || qType.includes('YES/NO') || /yes.*no/i.test(lowerText);
        const isWriting = question.question_type === 'Essay' || question.question_type === 'Letter';
        const isSpeaking = question.question_type === 'Part1' || question.question_type === 'Part2' || question.question_type === 'Part3';

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
                            <span><SmartText text={opt} onLookup={handleWordLookup} /></span>
                        </div>
                    ))}
                </div>
            );
        } else if (isTFNG || isYNNG) {
            const options = isTFNG ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN'];
            return (
                <div className="tfng-options-grid">
                    {options.map(opt => (
                        <button
                            key={opt}
                            className={`tfng-btn ${userAnswer === opt ? 'active' : ''}`}
                            onClick={() => !feedback && setUserAnswer(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        } else if (isWriting) {
            // Large textarea for essays and letters
            return (
                <div className="input-wrapper">
                    <textarea
                        className="text-area-large"
                        placeholder={question.question_type === 'Essay'
                            ? "Write your essay here (minimum 250 words)..."
                            : "Write your letter here (minimum 150 words)..."}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={!!feedback}
                        rows={15}
                    />
                    <div className="word-count">
                        Word count: {userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length}
                    </div>
                </div>
            );
        } else if (isSpeaking) {
            // Medium textarea for speaking responses
            return (
                <div className="input-wrapper">
                    <textarea
                        className="text-area-medium"
                        placeholder="Type your spoken response here or record your answer..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={!!feedback}
                        rows={8}
                    />
                    <div className="speaking-tip">
                        💡 Tip: Practice speaking out loud, then write down your key points here.
                    </div>
                </div>
            );
        } else {
            return (
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="text-input"
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={!!feedback}
                    />
                </div>
            );
        }
    };

    const strategy = STRATEGIES[question.question_type] || STRATEGIES['MCQ'];

    return (
        <div className="practice-test-container">
            <header className="test-header">
                <div className="header-left">
                    <button onClick={() => navigate('/practice')} className="back-link">
                        <span className="icon">←</span>
                        <span className="text">Practice Library</span>
                    </button>
                    <div className="breadcrumb">
                        <span>{question.section}</span>
                        <span className="separator">/</span>
                        <span className="current">{question.question_type}</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="timer-mock">
                        <span className="pulse-dot"></span>
                        Practice Mode
                    </div>
                </div>
            </header>

            <div className="test-main-layout two-column-layout">
                {/* Left Column - Passage (Scrollable) */}
                {(question.content.passage || question.content.audio_url || question.content.audio_generated) && (
                    <div className="passage-column scrollable-column" onMouseUp={handleTextSelection}>
                        <div className="resource-panel premium-glass">
                            <div className="panel-header">
                                <span className="label">
                                    {question.section === 'Listening' ? '🎧 Audio Source' : '📖 PASSAGE 1'}
                                </span>
                            </div>

                            {/* Standard Audio Player (for MP3 files) */}
                            {question.content.audio_url && (
                                <div className="audio-wrapper">
                                    <audio controls src={question.content.audio_url}>
                                        Your browser does not support audio.
                                    </audio>
                                </div>
                            )}

                            {/* TTS Audio Player (if generated via AI) */}
                            {!question.content.audio_url && (question.content.audio_generated || (question.section === 'Listening' && question.content.passage)) && (
                                <div className="audio-wrapper tts-player">
                                    <div className="tts-controls-row">
                                        <button
                                            className="tts-play-btn"
                                            onClick={handlePlayTTS}
                                        >
                                            ▶ Play Audio Track
                                        </button>
                                        <button
                                            className="tts-stop-btn"
                                            onClick={() => window.speechSynthesis.cancel()}
                                        >
                                            ⏹ Stop
                                        </button>
                                    </div>
                                    <div className="audio-visualizer-mock"></div>
                                </div>
                            )}

                            {/* Show Passage Text only for Reading (or if it's not strictly hidden for listening) */}
                            {question.content.passage && (
                                <div className={`passage-content ${question.section === 'Listening' ? 'blurred-text' : ''}`}>
                                    <SmartText text={question.content.passage} onLookup={handleWordLookup} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Right Column - Questions (Scrollable) */}
                <div className="questions-column scrollable-column" onMouseUp={handleTextSelection}>
                    <div className="question-panel">
                        <div className="question-card premium-glass">
                            <div className="questions-header">
                                <h3>Question Task</h3>
                                {/* Render Instructions if available, else fallback to text */}
                                {question.content.instructions && (
                                    <div className="instructions-box">
                                        <strong>Instructions:</strong> <SmartText text={question.content.instructions} onLookup={handleWordLookup} />
                                    </div>
                                )}
                                <p className="instructions-text">
                                    <SmartText text={question.content.text} onLookup={handleWordLookup} />
                                </p>

                                {/* Render Image/Diagram if available */}
                                {question.content.image_url && (
                                    <div className="question-image-container">
                                        <img
                                            src={question.content.image_url}
                                            alt="Question Visual/Diagram"
                                            className="question-diagram"
                                            onClick={() => window.open(question.content.image_url, '_blank')}
                                            title="Click to expand"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="interaction-zone">
                                {renderInput()}
                            </div>

                            {!feedback && (
                                <div className="action-row">
                                    <button
                                        className="submit-neon-btn"
                                        onClick={handleSubmit}
                                        disabled={!userAnswer || submitting}
                                    >
                                        {submitting ? 'VALIDATING...' : 'SUBMIT ANSWER'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Feedback Section */}
                        {feedback && (
                            <div className={`result-card ${feedback.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                                <div className="result-header">
                                    <div className="result-badge">
                                        {feedback.isCorrect ? '✨ CORRECT' : '⚡ INCORRECT'}
                                    </div>
                                    <div className="correct-answer-reveal">
                                        Expected: <span>{String(question.correct_answer)}</span>
                                    </div>
                                </div>
                                {feedback.explanation && (
                                    <div className="explanation-box">
                                        <h4>Rationalization</h4>
                                        <p><SmartText text={feedback.explanation} onLookup={handleWordLookup} /></p>
                                    </div>
                                )}
                                <button className="next-btn" onClick={() => navigate('/practice')}>
                                    Return to Dashboard →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Strategy Sidebar - Now positioned absolutely */}
                <aside className={`strategy-sidebar ${showStrategy ? 'open' : 'closed'}`}>
                    <div className="strategy-card premium-glass">
                        <button className="toggle-strategy" onClick={() => setShowStrategy(!showStrategy)}>
                            {showStrategy ? '×' : '💡'}
                        </button>

                        {showStrategy && (
                            <div className="strategy-content">
                                <div className="strategy-tag">TACTICAL STRATEGY</div>
                                <h3><SmartText text={strategy.title} onLookup={handleWordLookup} /></h3>
                                <ul className="strategy-steps">
                                    {strategy.steps.map((step, i) => (
                                        <li key={i}><SmartText text={step} onLookup={handleWordLookup} /></li>
                                    ))}
                                </ul>
                                <div className="pro-tip">
                                    <strong>PRO TIP:</strong> <SmartText text={strategy.hint} onLookup={handleWordLookup} />
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Vocab Context Menu (Portal/Absolute) */}
            {vocabMenu && (
                <div
                    className="vocab-context-menu premium-glass"
                    style={{
                        position: 'absolute',
                        left: vocabMenu.x,
                        top: vocabMenu.y,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 2000
                    }}
                >
                    <div className="vocab-menu-header">
                        <span className="vocab-word">{vocabMenu.word}</span>
                        <div className="vocab-actions">
                            <button className="vm-close" onClick={() => setVocabMenu(null)}>✕</button>
                        </div>
                    </div>

                    <div className="vocab-menu-body">
                        {vocabDefinition?.loading && <div className="loader-dots">Loading...</div>}
                        {vocabDefinition?.error && <div className="vm-error">{vocabDefinition.error}</div>}

                        {vocabDefinition?.definition && (
                            <div className="vm-definition-block">
                                <span className="vm-type">{vocabDefinition.type}</span>
                                <p className="vm-def">{vocabDefinition.definition}</p>
                            </div>
                        )}
                    </div>

                    {vocabDefinition?.definition && (
                        <button
                            className="vm-save-btn"
                            onClick={saveToVocabBank}
                            disabled={savingVocab}
                        >
                            {savingVocab ? 'Saving...' : '💾 Save to Vocab Bank'}
                        </button>
                    )}
                </div>
            )}

            {/* Floating Side Handle (Trigger) */}
            {!isDrawerOpen && (
                <button className="drawer-floating-handle" onClick={() => setIsDrawerOpen(true)}>
                    <span className="handle-chevron">»</span>
                </button>
            )}

            {/* Side Drawer Modal Overlay (Crystal Glass) */}
            <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="drawer-panel premium-glass" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <div className="drawer-title-area">
                            <h2>Expert Control Panel</h2>
                            <p>Seamlessly navigate your {skillFilter} session</p>
                        </div>
                        <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>✕</button>
                    </div>

                    <div className="drawer-content-scroll">
                        <div className="drawer-section">
                            <h3 className="section-label">PRACTICE INTERFACE</h3>

                            <div className="qbank-img-header">
                                <div className="qheader-left">
                                    <div className="q-category-badge">{skillFilter.charAt(0)}</div>
                                    <h2 className="q-sub-title">{categoryTitle}</h2>
                                </div>
                                <button className="reset-practice-btn" onClick={handleResetPractice}>Reset Practice</button>
                            </div>

                            <div className="drawer-qbank-filters">
                                <div className="qbank-filter-row">
                                    <div className="qbank-checkbox-group">
                                        <label className="q-checkbox-label">
                                            <input type="checkbox" defaultChecked /> <span>All</span>
                                        </label>
                                        <label className="q-checkbox-label">
                                            <input type="checkbox" /> <span>Practiced</span>
                                        </label>
                                        <label className="q-checkbox-label">
                                            <input type="checkbox" /> <span>Not Practiced</span>
                                        </label>
                                    </div>

                                    <div className="qbank-action-row">
                                        <div className="qbank-search-v2">
                                            <input
                                                type="text"
                                                placeholder="Content / Title / Number"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                            <button className="search-btn-v2" onClick={handleSearch}>🔍</button>
                                        </div>
                                        <button className="download-material-btn">Download Material</button>
                                    </div>
                                </div>
                            </div>

                            <div className="qbank-tab-and-meta">
                                <div className="qbank-tab-group">
                                    <span className="qbank-tab active">All</span>
                                    <span className="qbank-tab">Prediction</span>
                                    <span className="qbank-tab">Bookmark ▾</span>
                                    <span className="qbank-tab">Level ▾</span>
                                </div>
                                <div className="qbank-meta-info">
                                    <div className="qbank-meta-icons">
                                        <span>📊</span>
                                        <span>📉</span>
                                    </div>
                                    <div className="qbank-count-text">
                                        <strong>{filteredQuestions.length}</strong> Questions
                                        <p>(Active Filter)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="drawer-q-list">
                                {filteredQuestions.length > 0 ? (
                                    filteredQuestions.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className={`drawer-q-item ${id === q.id ? 'active-q' : ''}`}
                                            onClick={() => navigate(`/practice/${q.id}`, { state: location.state })}
                                        >
                                            <div className="q-item-left">
                                                <span className="q-id">{q.shortId}</span>
                                                <p className="q-name">{q.title}</p>
                                            </div>
                                            <div className="q-item-right">
                                                <span className={`q-diff-badge ${q.diff.toLowerCase()}`}>{q.diff}</span>
                                                <span className="q-new-label">New</span>
                                                <span className="q-app-label">{q.app}</span>
                                                <span className="q-bookmark-icon">🔖</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results-message">
                                        <p>No questions found matching "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="drawer-qbank-pagination">
                                <button className="pag-btn prev disabled">←</button>
                                <button className="pag-btn active">1</button>
                                <button className="pag-btn">2</button>
                                <button className="pag-btn next">→</button>
                            </div>

                            <button className="view-full-library-btn" onClick={() => navigate('/practice')}>View Full Library →</button>
                        </div>

                        <div className="drawer-footer-actions">
                            <button className="full-width-btn primary-grad-btn">Upgrade to Enterprise</button>
                            <button className="full-width-btn secondary-btn" onClick={handleSignOut}>Sign Out Securely</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeTest;


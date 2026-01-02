import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import SmartText from '../../components/SmartText';
import './ReadingTest.css';



// Helper to render HTML and hydrate inputs
const HtmlQuestion = ({ html, qId, answer, onAnswer, onLookup }) => {
    const containerRef = useRef(null);
    const inputsRef = useRef([]);

    useEffect(() => {
        if (!containerRef.current) return;

        const gaps = containerRef.current.querySelectorAll('.exam-gap-display');
        if (gaps.length > 0) {
            const gap = gaps[0];
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'academic-input inline-gap-hydrated';
            input.value = answer;
            input.style.display = 'inline-block';
            input.style.width = '140px';
            input.style.margin = '0 5px';

            gap.parentNode.replaceChild(input, gap);
            const handleInput = (e) => onAnswer(e.target.value);
            input.addEventListener('input', handleInput);
            inputsRef.current.push({ element: input, handler: handleInput });
        }
    }, [html]);

    useEffect(() => {
        const entry = inputsRef.current[0];
        if (entry && entry.element.value !== answer) {
            entry.element.value = answer;
        }
    }, [answer]);

    // Use SmartHtml inside the container for the text parts
    return (
        <div ref={containerRef} className="html-q-container">
            <SmartText text={html} onLookup={onLookup} />
        </div>
    );
};

const ReadingTest = () => {
    const { id } = useParams(); // passageId
    const navigate = useNavigate();
    const passageRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [passage, setPassage] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState(() => {
        try {
            const saved = localStorage.getItem(`reading_test_${id}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to parse saved answers:', e);
            return {};
        }
    });

    useEffect(() => {
        if (id && answers) {
            localStorage.setItem(`reading_test_${id}`, JSON.stringify(answers));
        }
    }, [answers, id]);

    // Vocab Context Menu State
    const [vocabMenu, setVocabMenu] = useState(null); // { x, y, word }
    const [vocabDefinition, setVocabDefinition] = useState(null);
    const [savingVocab, setSavingVocab] = useState(false);

    const [timeLeft, setTimeLeft] = useState(20 * 60); // Default 20 mins per passage
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    useEffect(() => {
        loadTestContent();
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const handleGlobalClick = (e) => {
            if (!e.target.closest('.vocab-context-menu') && !e.target.closest('.live-word')) {
                setVocabMenu(null);
                setVocabDefinition(null);
            }
        };
        document.addEventListener('click', handleGlobalClick);

        return () => {
            clearInterval(timer);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [id]);

    const handleWordLookup = (word, e) => {
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        setVocabMenu({
            x: rect.left + window.scrollX + (rect.width / 2),
            y: rect.top + window.scrollY - 10,
            word: word
        });
        fetchDefinition(word);
    };

    const handleTextSelection = async (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text && text.length > 1 && !text.includes(' ') && /^[a-zA-Z]+$/.test(text)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            setVocabMenu({
                x: rect.left + window.scrollX + (rect.width / 2),
                y: rect.top + window.scrollY - 10,
                word: text
            });
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
            setVocabMenu(null);
        } catch (err) {
            console.error("Save Vocab Error", err);
            alert("Failed to save word.");
        } finally {
            setSavingVocab(false);
        }
    };

    const loadTestContent = async () => {
        setLoading(true);
        try {
            console.log('Fetching passage with ID:', id);
            const { data: passageData, error: pError } = await supabase
                .from('passages')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (pError) {
                console.error('Passage fetch error:', pError);
                throw new Error('Passage not found or could not be loaded.');
            }
            setPassage(passageData);

            console.log('Fetching questions for passage:', id);
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('*')
                .eq('passage_id', id)
                .is('deleted_at', null)
                .order('display_order', { ascending: true });

            if (qError) {
                console.error('Questions fetch error:', qError);
                throw new Error('Failed to load questions for this passage.');
            }
            setQuestions(qData || []);

        } catch (err) {
            console.error('Error loading test:', err);
            setPassage(null); // Ensure error state is triggered
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const scrollToQuestion = (qId, index) => {
        setActiveQuestionIndex(index);
        const el = document.getElementById(`q-${qId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Are you sure you want to finish the test?')) return;

        let correctCount = 0;
        let totalScore = 0;
        let userTotalScore = 0;

        questions.forEach(q => {
            const qScore = q.score || 1;
            totalScore += qScore;

            const userAnswer = answers[q.id];
            const correctAnswer = q.correct_answer;

            if (userAnswer) {
                const normalizedUser = userAnswer.toString().toLowerCase().trim();
                const normalizedCorrect = correctAnswer.toString().toLowerCase().trim();

                if (normalizedUser === normalizedCorrect) {
                    correctCount++;
                    userTotalScore += qScore;
                }
            }
        });

        alert(`Test Finished!\nResult: ${correctCount} / ${questions.length} correct\nTotal Points: ${userTotalScore} / ${totalScore}`);
        localStorage.removeItem(`reading_test_${id}`);
        navigate('/dashboard');
    };

    if (loading) return (
        <div className="reading-simulation-loading">
            <div className="loader-ring"></div>
            <p>Initializing Exam Environment...</p>
        </div>
    );

    if (!passage) return <div className="reading-error">Passage not found.</div>;

    // Group questions by type for better UI organization
    const groupedQuestions = questions.reduce((acc, q) => {
        const type = q.question_type || 'General';
        if (!acc[type]) acc[type] = [];
        acc[type].push(q);
        return acc;
    }, {});

    return (
        <div className="reading-simulation-container">
            {/* Exam Header */}
            <header className="exam-header">
                <div className="header-left">
                    <div className="exam-brand">IELTS <span>PLUS</span></div>
                    <div className="divider"></div>
                    <div className="test-info">
                        <span className="test-type">
                            {questions.length > 0 ? (questions[0].section || 'PRACTICE').toUpperCase() : 'PRACTICE TEST'}
                        </span>
                        <span className="passage-title-meta">{passage.title}</span>
                    </div>
                </div>

                <div className="header-center">
                    <div className={`timer-box ${timeLeft < 300 ? 'timer-warning' : ''}`}>
                        <span className="clock-icon">⏱</span>
                        <span className="time-remaining">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="header-right">
                    <button className="btn-exit-exam" onClick={() => navigate('/practice')}>EXIT TEST</button>
                    <button className="btn-finish-exam" onClick={handleSubmit}>FINISH TEST</button>
                </div>
            </header>

            {/* Main Content Areas */}
            <main className="exam-workspace">
                {/* Left Panel: The Reading Passage / Context / Audio */}
                <section className="passage-scroll-pane" ref={passageRef} onMouseUp={handleTextSelection}>
                    <div className="passage-content">
                        <div className="reading-text-body">
                            {/* Render Passage Content (Text, Audio, or Image) */}
                            <SmartText text={passage.content} onLookup={handleWordLookup} />
                        </div>
                    </div>
                </section>

                {/* Right Panel: The Interactive Questions */}
                <section className="questions-scroll-pane" onMouseUp={handleTextSelection}>
                    <div className="questions-container">
                        {Object.entries(groupedQuestions).map(([type, typeQs], typeIdx) => (
                            <div key={type} className="question-set">
                                <div className="section-instruction-box">
                                    <h3>Questions {questions.indexOf(typeQs[0]) + 1} - {questions.indexOf(typeQs[typeQs.length - 1]) + 1}</h3>
                                    <p className="instruction-text">
                                        {typeQs[0].content?.instructions ? (
                                            <SmartText text={typeQs[0].content.instructions} onLookup={handleWordLookup} />
                                        ) : `Read the instructions carefully for this ${type} section.`}
                                    </p>
                                </div>

                                {typeQs.map((q, idx) => {
                                    const globalIdx = questions.indexOf(q);
                                    return (
                                        <div key={q.id} className="q-item-card" id={`q-${q.id}`}>
                                            <div className="q-meta-row">
                                                <span className="q-number-bubble">{globalIdx + 1}</span>
                                                {/* INLINE GAP RENDERER */}
                                                <div className="q-statement">
                                                    {((q.content?.text || q.text || '').includes('<')) ? (
                                                        <HtmlQuestion
                                                            html={q.content?.text || q.text || ''}
                                                            qId={q.id}
                                                            answer={answers[q.id] || ''}
                                                            onAnswer={(val) => handleAnswerChange(q.id, val)}
                                                            onLookup={handleWordLookup}
                                                        />
                                                    ) : (
                                                        <SmartText text={q.content?.text || q.text || ''} onLookup={handleWordLookup} />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="q-input-surface">
                                                {/* MCQ Layout */}
                                                {q.question_type === 'MCQ' && (
                                                    <div className="mcq-options-stack">
                                                        {q.options?.map((opt, i) => (
                                                            <label key={i} className={`mcq-option-label ${answers[q.id] === opt ? 'selected' : ''}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`q-${q.id}`}
                                                                    value={opt}
                                                                    checked={answers[q.id] === opt}
                                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                                />
                                                                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                                                                <span className="opt-text">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Completion Questions / Short Answer */}
                                                {['GapFill', 'ShortAnswer', 'SentenceCompletion', 'SummaryCompletion', 'NoteCompletion', 'TableCompletion', 'FlowchartCompletion', 'DiagramLabeling'].includes(q.question_type) &&
                                                    !((q.content?.text || q.text).includes('exam-gap-display') || (q.content?.text || q.text).includes('inline-gap-hydrated') || (q.content?.text || q.text).includes('__________')) && (
                                                        <div className="input-field-wrapper">
                                                            <input
                                                                type="text"
                                                                autoComplete="off"
                                                                className="academic-input"
                                                                placeholder={q.word_limit ? `Limit: ${q.word_limit} words` : "Enter answer..."}
                                                                value={answers[q.id] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (q.word_limit) {
                                                                        const words = val.trim().split(/\s+/).filter(w => w.length > 0);
                                                                        if (words.length > q.word_limit) return; // Prevent extra words
                                                                    }
                                                                    handleAnswerChange(q.id, val);
                                                                }}
                                                            />
                                                            {q.word_limit && (
                                                                <span className="word-limit-hint">Maximum {q.word_limit} {q.word_limit === 1 ? 'word' : 'words'}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                {/* True/False/Not Given / Yes/No/Not Given */}
                                                {['T/F/NG', 'Y/N/NG'].includes(q.question_type) && (
                                                    <div className="binary-options-row">
                                                        {(q.question_type === 'T/F/NG' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map(opt => (
                                                            <button
                                                                key={opt}
                                                                className={`binary-btn ${answers[q.id] === opt ? 'active' : ''}`}
                                                                onClick={() => handleAnswerChange(q.id, opt)}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Matching Tasks */}
                                                {q.question_type === 'Matching' && (
                                                    <div className="matching-selector">
                                                        <select
                                                            className="academic-select"
                                                            value={answers[q.id] || ''}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        >
                                                            <option value="">Select option...</option>
                                                            {q.options?.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Exam Navigation Footer */}
            <footer className="nav-footer">
                <div className="progress-bar-container">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="question-grid-nav">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            className={`nav-btn ${answers[q.id] ? 'completed' : ''} ${activeQuestionIndex === idx ? 'current' : ''}`}
                            onClick={() => scrollToQuestion(q.id, idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </footer>

            {/* Vocab Context Menu */}
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
        </div>
    );
};

export default ReadingTest;

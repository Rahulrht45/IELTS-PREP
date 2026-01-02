import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import SmartText from '../../components/SmartText';
import './ExamMock.css';

const ExamPreviewPage = ({ currentTheme, onToggleTheme }) => {
    const { passageId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [passage, setPassage] = useState(null);
    const [vocabMenu, setVocabMenu] = useState(null);
    const [vocabDefinition, setVocabDefinition] = useState(null);
    const [savingVocab, setSavingVocab] = useState(false);
    const [customTextColor, setCustomTextColor] = useState(null);

    // Resizable Split Pane State
    const [leftPaneWidth, setLeftPaneWidth] = useState(50); // initial 50%
    const [isDragging, setIsDragging] = useState(false);

    const handleGlobalClick = (e) => {
        if (!e.target.closest('.vocab-context-menu') && !e.target.closest('.live-word')) {
            setVocabMenu(null);
            setVocabDefinition(null);
        }
    };

    useEffect(() => {
        if (passageId) {
            loadExamData();
        }
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [passageId]);

    // --- Resizer Handlers ---
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Calculate percentage based on viewport width
        const newWidth = (e.clientX / window.innerWidth) * 100;

        if (newWidth > 20 && newWidth < 80) { // Limit min/max width
            setLeftPaneWidth(newWidth);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none'; // prevent text selection while dragging
            document.body.style.cursor = 'col-resize';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'auto'; // restore selection
            document.body.style.cursor = 'default';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const loadExamData = async () => {
        setLoading(true);
        try {
            // Load Passage
            const { data: pData } = await supabase.from('passages').select('*').eq('id', passageId).single();
            setPassage(pData);

            // Load Linked Questions
            const { data: qData } = await supabase
                .from('questions')
                .select('*')
                .eq('passage_id', passageId)
                .is('deleted_at', null)
                .order('display_order', { ascending: true });
            setQuestions(qData || []);
        } catch (err) {
            console.error('Error loading exam data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWordLookup = (word, e) => {
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();

        // Calculate safe position (keep within bounds)
        const left = rect.left + window.scrollX + (rect.width / 2);
        const top = rect.top + window.scrollY - 10;

        setVocabMenu({
            x: left,
            y: top,
            word: word
        });
        fetchDefinition(word);
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

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                <div className="loader">Loading Exam Preview...</div>
            </div>
        );
    }

    return (
        <div className="exam-preview-page" data-theme={currentTheme} style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header className="exam-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={() => navigate('/admin')} style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--exam-header-text)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        ←
                    </button>
                    <div>
                        <h2 style={{ margin: 0 }}>{passage?.title || 'IELTS Reading Preview'}</h2>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button
                        onClick={onToggleTheme}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '1rem'
                        }}
                    >
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                            type="color"
                            onChange={(e) => setCustomTextColor(e.target.value)}
                            title="Preview Text Color"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                padding: '0'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        fontSize: '0.8rem',
                        color: '#ddd',
                        lineHeight: '1.2'
                    }}>
                        <span>Candidate Name: <strong>John Doe</strong></span>
                        <span>Candidate No: <strong>123456</strong></span>
                    </div>
                    <div className="exam-header-meta" style={{ fontSize: '1.2rem' }}>
                        20:00
                    </div>
                    <button style={{
                        background: '#D92D20',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>
                        Hide
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Passage Section (Left) */}
                <section className="exam-pane left" style={{
                    width: `${leftPaneWidth}%`,
                    overflowY: 'auto',
                    borderRight: 'none',
                    display: 'block'
                }}>
                    <article className="academic-passage">
                        <h1 style={{ color: customTextColor || 'inherit' }}>{passage?.title}</h1>
                        <div className="academic-passage-text" style={{ color: customTextColor || 'inherit' }}>
                            <SmartText text={String(passage?.content || "")} onLookup={handleWordLookup} />
                        </div>
                    </article>
                </section>

                {/* DRAGGER HANDLE */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        width: '6px',
                        cursor: 'col-resize',
                        background: isDragging ? '#2196F3' : '#333', // Blue when dragging
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 50,
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => { if (!isDragging) e.currentTarget.style.background = '#2196F3'; }}
                    onMouseOut={(e) => { if (!isDragging) e.currentTarget.style.background = '#333'; }}
                >
                </div>

                {/* Questions Section (Right) */}
                <section className="exam-pane right" style={{
                    width: `${100 - leftPaneWidth}%`,
                    overflowY: 'auto',
                }}>
                    <div className="exam-questions-container">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="exam-question-item">
                                <div className="question-header-row">
                                    <div className="question-number-box">
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontWeight: 'bold', alignSelf: 'center', color: 'var(--exam-text)', opacity: 0.7 }}>
                                        {q.difficulty}
                                    </span>
                                </div>

                                {q.content && q.content.instructions && (
                                    <div className="exam-instruction-box">
                                        {String(q.content.instructions)}
                                    </div>
                                )}

                                <div className="question-content">
                                    <SmartText text={String(q.content?.text || "")} onLookup={handleWordLookup} />
                                </div>

                                {q.question_type === 'MCQ' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
                                        {q.options?.map((opt, oIdx) => (
                                            <div key={oIdx} className="exam-mcq-option">
                                                <div className="exam-mcq-radio"></div>
                                                <span style={{ color: 'var(--exam-text)', fontSize: '1rem' }}>{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1rem' }}>
                                        <input
                                            type="text"
                                            className="exam-bottom-input"
                                            placeholder="Answer..."
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                display: q.content?.text?.includes('____') ? 'none' : 'block'
                                            }}
                                            disabled
                                            spellCheck="false"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Vocab Context Menu (Portal/Absolute) */}
            {
                vocabMenu && (
                    <div
                        className="vocab-context-menu"
                        style={{
                            position: 'absolute',
                            left: vocabMenu.x,
                            top: vocabMenu.y,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 2000,
                            background: 'var(--exam-bg)',
                            border: '1px solid var(--exam-border)',
                            padding: '16px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            minWidth: '250px',
                            maxWidth: '300px',
                            color: 'var(--exam-text)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--exam-border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize' }}>{vocabMenu.word}</span>
                            <button onClick={() => setVocabMenu(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--exam-text)' }}>✕</button>
                        </div>

                        <div className="vocab-menu-body">
                            {vocabDefinition?.loading && <div style={{ fontStyle: 'italic', color: 'var(--exam-text)', opacity: 0.7 }}>Loading definition...</div>}
                            {vocabDefinition?.error && <div style={{ color: '#ef4444' }}>{vocabDefinition.error}</div>}

                            {vocabDefinition?.definition && (
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        background: 'var(--exam-badge-bg)',
                                        color: 'var(--exam-badge-text)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        marginBottom: '6px'
                                    }}>
                                        {vocabDefinition.type}
                                    </span>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{vocabDefinition.definition}</p>
                                </div>
                            )}
                        </div>

                        {vocabDefinition?.definition && (
                            <button
                                onClick={saveToVocabBank}
                                disabled={savingVocab}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    opacity: savingVocab ? 0.7 : 1
                                }}
                            >
                                {savingVocab ? 'Saving...' : '💾 Save to Bank'}
                            </button>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default ExamPreviewPage;

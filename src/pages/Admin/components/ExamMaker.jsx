import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';

const ExamMaker = () => {
    const navigate = useNavigate();
    const [selectedSection, setSelectedSection] = useState('Reading');
    const [passages, setPassages] = useState([]);
    const [selectedPassageId, setSelectedPassageId] = useState('');
    const [selectedPassage, setSelectedPassage] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPassages();
    }, []);

    useEffect(() => {
        if (selectedPassageId) {
            loadQuestions();
            const passage = passages.find(p => p.id === selectedPassageId);
            setSelectedPassage(passage);
        } else {
            setQuestions([]);
            setSelectedPassage(null);
        }
    }, [selectedPassageId]);

    const loadPassages = async () => {
        const { data } = await supabase.from('passages').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        setPassages(data || []);
    };

    const loadQuestions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('questions')
            .select('*')
            .eq('passage_id', selectedPassageId)
            .is('deleted_at', null)
            .order('display_order', { ascending: true });
        setQuestions(data || []);
        setLoading(false);
    };

    const handlePreviewClick = () => {
        if (selectedPassageId) {
            navigate(`/admin/exam-preview/${selectedPassageId}`);
        }
    };

    return (
        <div className="exam-maker-container" style={{ padding: '2rem' }}>
            <div className="premium-glass" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📑 Exam Paper Maker
                </h2>

                {/* Step 1: Select Section */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Step 1: Select Exam Section</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['Reading', 'Listening', 'Writing', 'Speaking'].map(section => (
                            <button
                                key={section}
                                onClick={() => {
                                    setSelectedSection(section);
                                    setSelectedPassageId('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-main)',
                                    background: selectedSection === section ? 'var(--primary-blue)' : 'var(--bg-input)',
                                    color: selectedSection === section ? 'white' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}
                            >
                                {section === 'Reading' ? '📖' : section === 'Listening' ? '🎧' : section === 'Writing' ? '✍️' : '🗣️'} {section}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Select Passage */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Step 2: Select {selectedSection} Passage</label>
                    <select
                        value={selectedPassageId}
                        onChange={(e) => setSelectedPassageId(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '8px', fontSize: '0.95rem' }}
                    >
                        <option value="">-- Choose a {selectedSection} Passage --</option>
                        {passages
                            .filter(p => p.section === selectedSection)
                            .map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                    </select>
                </div>

                {selectedPassageId && (
                    <div className="paper-info-panel animate-in" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary-blue)' }}>{selectedPassage?.title}</h3>
                            <span className="badge" style={{ background: 'var(--primary-blue)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                                {questions.length} Questions Linked
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            All questions linked to this passage will be automatically bundled into this exam paper.
                        </p>

                        <div className="questions-mini-list" style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                            {questions.map((q, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>Q{i + 1}: {q.content.text.substring(0, 50).replace(/<[^>]*>/g, '')}...</span>
                                    <span style={{ color: 'var(--primary-green)' }}>{q.question_type}</span>
                                </div>
                            ))}
                            {questions.length === 0 && <p style={{ textAlign: 'center', color: '#ef4444' }}>No questions linked to this passage yet.</p>}
                        </div>
                    </div>
                )}

                <div className="actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        className="btn-primary-red"
                        disabled={!selectedPassageId || questions.length === 0}
                        onClick={handlePreviewClick}
                        style={{ flex: 1, padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        👁️ Live Preview Exam Paper
                    </button>
                    <button
                        className="btn-secondary"
                        disabled={!selectedPassageId}
                        style={{
                            padding: '1rem 2rem',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-main)',
                            borderRadius: '99px',
                            cursor: 'pointer'
                        }}
                    >
                        Save Paper
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExamMaker;

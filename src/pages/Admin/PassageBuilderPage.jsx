import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import '../../components/PassageManager.css';

const PassageBuilderPage = ({ currentTheme, onToggleTheme }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const passageId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [passageForm, setPassageForm] = useState({
        title: '',
        content: '',
        difficulty: 'Medium',
        section: 'Reading',
        exam_type: 'Academic',
        word_count: 0
    });

    // --- History / Undo-Redo Logic ---
    const [history, setHistory] = useState({ undoStack: [], redoStack: [] });

    const saveToHistory = (currentContent) => {
        setHistory(prev => ({
            undoStack: [...prev.undoStack, currentContent].slice(-50),
            redoStack: []
        }));
    };

    const handleUndo = () => {
        if (history.undoStack.length === 0) return;
        const prevContent = history.undoStack[history.undoStack.length - 1];
        const newUndoStack = history.undoStack.slice(0, -1);

        setHistory(prev => ({
            undoStack: newUndoStack,
            redoStack: [passageForm.content, ...prev.redoStack].slice(0, 50)
        }));
        setPassageForm(prev => ({ ...prev, content: prevContent }));
    };

    const handleRedo = () => {
        if (history.redoStack.length === 0) return;
        const nextContent = history.redoStack[0];
        const newRedoStack = history.redoStack.slice(1);

        setHistory(prev => ({
            undoStack: [...prev.undoStack, passageForm.content].slice(-50),
            redoStack: newRedoStack
        }));
        setPassageForm(prev => ({ ...prev, content: nextContent }));
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, passageForm.content]);

    // Load passage if editing
    useEffect(() => {
        if (passageId) {
            loadPassage();
        }
    }, [passageId]);

    const loadPassage = async () => {
        try {
            const { data, error } = await supabase
                .from('passages')
                .select('*')
                .eq('id', passageId)
                .single();

            if (error) throw error;

            setPassageForm({
                title: data.title,
                content: data.content,
                difficulty: data.difficulty,
                section: data.section || 'Reading',
                exam_type: data.exam_type || 'Academic',
                word_count: data.word_count || 0
            });
        } catch (err) {
            console.error('Error loading passage:', err);
            setMessage('❌ Error loading passage');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Save to history before big changes or on timer if needed, 
        // but definitely save before an automated tag insert (handled in insertTag)
        // For manual typing, we push to history when they stop typing or on specific intervals
        // but to keep it simple, we push every time name is 'content' and value length changed significantly
        if (name === 'content' && Math.abs(value.length - passageForm.content.length) > 10) {
            saveToHistory(passageForm.content);
        }

        setPassageForm(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'content') {
                newData.word_count = value.trim().split(/\s+/).filter(w => w.length > 0).length;
            }
            return newData;
        });
    };

    const insertColor = (color) => {
        const textarea = document.querySelector('textarea[name="content"]');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = passageForm.content;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}<span style="color: ${color}">${selected || 'Colored Text'}</span>${after}`;

        if (newText !== passageForm.content) {
            saveToHistory(passageForm.content);
            setPassageForm(prev => ({ ...prev, content: newText }));
        }
    };

    const insertTag = (tag) => {
        const textarea = document.querySelector('textarea[name="content"]');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = passageForm.content;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let newText;
        // Academic Formatting Logic using Classes
        if (tag === 'p') newText = `${before}<p class="passage-p">${selected || 'Paragraph text'}</p>${after}`;
        else if (tag === 'lead') newText = `${before}<p class="passage-lead">${selected || 'Lead/Intro text'}</p>${after}`;
        else if (tag === 'header') newText = `${before}<h3 class="passage-section-title">${selected || 'Section Header'}</h3>${after}`;
        else if (tag === 'letter') newText = `${before}<span class="paragraph-letter">A</span>${after}`;
        else if (tag === 'marker') newText = `${before}<span class="exam-marker">1</span>${after}`;
        else if (tag === 'highlight') newText = `${before}<span class="highlight">${selected}</span>${after}`;
        else if (tag === 'center') newText = `${before}<div class="text-center">${selected}</div>${after}`;
        else if (tag === 'right') newText = `${before}<div class="text-right">${selected}</div>${after}`;
        else if (tag === 'justify') newText = `${before}<div class="text-justify">${selected}</div>${after}`;
        else if (tag === 'indent') newText = `${before}<div class="text-indent">${selected}</div>${after}`;
        else if (tag === 'table') newText = `${before}\n<table class="academic-table">\n  <tr>\n    <th>Header 1</th>\n    <th>Header 2</th>\n  </tr>\n  <tr>\n    <td>Data 1</td>\n    <td>Data 2</td>\n  </tr>\n</table>\n${after}`;
        else newText = text;

        if (newText !== passageForm.content) {
            saveToHistory(passageForm.content);
            setPassageForm(prev => ({ ...prev, content: newText }));
        }
    };

    const handleSave = async () => {
        if (!passageForm.title || !passageForm.content) {
            setMessage('❌ Please fill in Title and Content.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in.');

            const passageData = {
                title: passageForm.title,
                content: passageForm.content,
                difficulty: passageForm.difficulty,
                section: passageForm.section,
                exam_type: passageForm.exam_type,
                word_count: passageForm.word_count,
                updated_at: new Date().toISOString()
            };

            if (passageId) {
                // Update
                const { error } = await supabase
                    .from('passages')
                    .update(passageData)
                    .eq('id', passageId);
                if (error) throw error;
                setMessage('✅ Passage updated successfully!');
            } else {
                // Create
                const { error } = await supabase
                    .from('passages')
                    .insert([passageData]);
                if (error) throw error;
                setMessage('✅ Passage created successfully!');
            }

            setTimeout(() => {
                navigate('/admin');
            }, 1000);
        } catch (err) {
            console.error('Error saving passage:', err);
            setMessage('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-header premium-glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                        ←
                    </button>
                    <h2 style={{ margin: 0, color: 'var(--admin-text)', fontSize: '1.1rem' }}>
                        {passageId ? 'Edit Passage' : 'Create New Passage'}
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {message && <div style={{ color: message.startsWith('❌') ? '#f87171' : '#4ade80', fontSize: '0.9rem' }}>{message}</div>}
                    <button
                        className="theme-toggle-btn"
                        onClick={onToggleTheme}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-main)',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-main)'
                        }}
                    >
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => navigate('/admin')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                    <button type="button" className="btn-primary" onClick={handleSave} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        {loading ? 'Saving...' : 'Save Passage'}
                    </button>
                </div>
            </div>

            <div className="builder-main" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div className="passage-editor">
                    <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={passageForm.title}
                                onChange={handleInputChange}
                                placeholder="e.g., The History of Coffee"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Section</label>
                            <select name="section" value={passageForm.section} onChange={handleInputChange}>
                                <option value="Reading">Reading</option>
                                <option value="Listening">Listening</option>
                                <option value="Writing">Writing</option>
                                <option value="Speaking">Speaking</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Exam Type</label>
                            <select name="exam_type" value={passageForm.exam_type} onChange={handleInputChange}>
                                <option value="Academic">Academic</option>
                                <option value="General Training">General Training</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Difficulty</label>
                            <select name="difficulty" value={passageForm.difficulty} onChange={handleInputChange}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group premium-glass" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                color: 'var(--admin-text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: 0
                            }}>
                                📝 Passage Content (HTML Supported) *
                            </label>
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--admin-text-muted)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontWeight: '600'
                            }}>
                                Rich Text Editor
                            </span>
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="rich-toolbar premium-glass" style={{
                            padding: '1rem',
                            marginBottom: '1rem',
                            borderRadius: '8px',
                            background: 'var(--admin-card-bg)'
                        }}>
                            <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--admin-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    📐 Structure & Layout
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('p')} style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        color: '#60a5fa',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>📄 Paragraph</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('lead')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>🎯 Lead Text</button>

                                    <div style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 0.5rem' }}></div>

                                    <button type="button" onClick={handleUndo} disabled={history.undoStack.length === 0} style={{
                                        padding: '0.5rem 0.75rem',
                                        background: history.undoStack.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid var(--admin-border)',
                                        color: history.undoStack.length === 0 ? 'var(--admin-text-muted)' : '#10b981',
                                        borderRadius: '6px',
                                        cursor: history.undoStack.length === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        opacity: history.undoStack.length === 0 ? 0.5 : 1
                                    }} title="Undo (Ctrl+Z)">↩️ Undo</button>

                                    <button type="button" onClick={handleRedo} disabled={history.redoStack.length === 0} style={{
                                        padding: '0.5rem 0.75rem',
                                        background: history.redoStack.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid var(--admin-border)',
                                        color: history.redoStack.length === 0 ? 'var(--admin-text-muted)' : '#8b5cf6',
                                        borderRadius: '6px',
                                        cursor: history.redoStack.length === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        opacity: history.redoStack.length === 0 ? 0.5 : 1
                                    }} title="Redo (Ctrl+Y)">↪️ Redo</button>

                                    <div style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 0.5rem' }}></div>

                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('header')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>📋 Section Header</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('table')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>📊 Table</button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--admin-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    🎨 Formatting & Style
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('letter')} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>🔤 Letter (A)</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('marker')} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>🔢 Marker [1]</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('highlight')} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>✨ Highlight</button>

                                    <div style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 0.5rem' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Color:</span>
                                        <input type="color" onChange={(e) => insertColor(e.target.value)} style={{ cursor: 'pointer', width: '28px', height: '28px', border: 'none', background: 'transparent', padding: 0 }} title="Apply Color" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ↔️ Text Alignment
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('center')} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>⬌ Center</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('right')} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>➡️ Right</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('justify')} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>↔️ Justify</button>
                                    <button type="button" className="toolbar-btn" onClick={() => insertTag('indent')} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>⇥ Indent</button>
                                </div>
                            </div>
                        </div>

                        {/* Editor Split View */}
                        <div className="editor-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ✏️ HTML Editor
                                </div>
                                <textarea
                                    name="content"
                                    value={passageForm.content}
                                    onChange={handleInputChange}
                                    rows={20}
                                    placeholder="Paste or type the reading passage here...&#10;&#10;Example:&#10;<p>The history of coffee begins in Ethiopia...</p>"
                                    required
                                    style={{
                                        resize: 'vertical',
                                        width: '100%',
                                        height: 'calc(100vh - 450px)',
                                        minHeight: '400px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        color: 'var(--admin-text)',
                                        fontSize: '0.9rem',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        lineHeight: '1.6'
                                    }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    👁️ Live Preview
                                </div>
                                <div className="passage-live-preview premium-glass" style={{
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    overflowY: 'auto',
                                    height: 'calc(100vh - 450px)',
                                    minHeight: '400px',
                                    background: '#ffffff',
                                    color: '#1e293b',
                                    border: '1px solid var(--admin-border)'
                                }}>
                                    <div
                                        className="preview-content"
                                        dangerouslySetInnerHTML={{ __html: passageForm.content || '<p style="color: #94a3b8; text-align: center; padding: 2rem;">Start typing to see preview...</p>' }}
                                        style={{ fontSize: '0.95rem', lineHeight: '1.8' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Word Count Display */}
                        <div className="word-count-display" style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>📊</span>
                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                                Word Count: <strong style={{ color: '#60a5fa', fontSize: '1.1rem' }}>{passageForm.word_count}</strong> words
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PassageBuilderPage;

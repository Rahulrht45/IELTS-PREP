import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import './PassageManager.css';

const PassageManager = () => {
    const [passages, setPassages] = useState([]);
    const [selectedPassage, setSelectedPassage] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [passageForm, setPassageForm] = useState({
        title: '',
        content: '',
        difficulty: 'Medium',
        exam_type: 'Academic',
        word_count: 0
    });

    // Load all passages
    useEffect(() => {
        loadPassages();
    }, []);

    const loadPassages = async () => {
        try {
            const { data, error } = await supabase
                .from('passages')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPassages(data || []);
        } catch (err) {
            console.error('Error loading passages:', err);
        }
    };

    const handleCreateNew = () => {
        setPassageForm({
            title: '',
            content: '',
            difficulty: 'Medium',
            exam_type: 'Academic',
            word_count: 0
        });
        setSelectedPassage(null);
        setIsCreating(true);
        setMessage('');
    };

    const handleEdit = (passage) => {
        setPassageForm({
            title: passage.title,
            content: passage.content,
            difficulty: passage.difficulty,
            exam_type: passage.exam_type || 'Academic',
            word_count: passage.word_count || 0
        });
        setSelectedPassage(passage.id);
        setIsCreating(true);
        setMessage('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPassageForm(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'content') {
                newData.word_count = value.trim().split(/\s+/).length;
            }
            return newData;
        });
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
        // Academic Formatting Logic
        if (tag === 'p') newText = `${before}<p>${selected || 'Paragraph text'}</p>${after}`;
        else if (tag === 'lead') newText = `${before}<p class="passage-lead">${selected || 'Lead/Intro text'}</p>${after}`;
        else if (tag === 'header') newText = `${before}<h3>${selected || 'Section Header'}</h3>${after}`;
        else if (tag === 'letter') newText = `${before}<span class="paragraph-letter">A</span>${after}`;
        else if (tag === 'marker') newText = `${before}<span class="exam-marker">1</span>${after}`;
        else if (tag === 'highlight') newText = `${before}<span class="highlight">${selected}</span>${after}`;
        else if (tag === 'center') newText = `${before}<div class="text-center">${selected}</div>${after}`;
        else if (tag === 'right') newText = `${before}<div class="text-right">${selected}</div>${after}`;
        else if (tag === 'justify') newText = `${before}<div class="text-justify">${selected}</div>${after}`;
        else if (tag === 'indent') newText = `${before}<div class="text-indent">${selected}</div>${after}`;
        else if (tag === 'table') newText = `${before}\n<table class="exam-table">\n  <tr>\n    <th>Header 1</th>\n    <th>Header 2</th>\n  </tr>\n  <tr>\n    <td>Data 1</td>\n    <td>Data 2</td>\n  </tr>\n</table>\n${after}`;
        else newText = text;

        setPassageForm(prev => ({ ...prev, content: newText }));
        // Restore focus? (React state update makes this tricky without ref, keeping simple for now)
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
                exam_type: passageForm.exam_type,
                word_count: passageForm.word_count
            };

            if (selectedPassage) {
                // Update
                const { error } = await supabase
                    .from('passages')
                    .update(passageData)
                    .eq('id', selectedPassage);
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

            setIsCreating(false);
            loadPassages();
        } catch (err) {
            console.error('Error saving passage:', err);
            setMessage('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!window.confirm('Delete this passage permanently?')) return;

        setLoading(true);
        try {
            // Get user to check permissions
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to delete passages.');
            }

            // Try soft delete first (mark as deleted)
            const { data: softDeleteData, error: softDeleteError } = await supabase
                .from('passages')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            console.log('Soft delete response:', { softDeleteData, softDeleteError });

            // Check if soft delete actually worked
            if (!softDeleteError && softDeleteData && softDeleteData.length > 0) {
                setMessage('✅ Passage moved to recycle bin.');
                await loadPassages();
                return;
            }

            // If soft delete failed or returned no data, try hard delete
            console.log('Soft delete failed or returned no data, trying hard delete...');
            const { data: hardDeleteData, error: hardDeleteError } = await supabase
                .from('passages')
                .delete()
                .eq('id', id)
                .select();

            console.log('Hard delete response:', { hardDeleteData, hardDeleteError });

            if (hardDeleteError) {
                throw hardDeleteError;
            }

            // Check if hard delete actually worked
            if (!hardDeleteData || hardDeleteData.length === 0) {
                throw new Error('Delete operation completed but no rows were affected. This may be due to Row Level Security (RLS) policies. Please check if you have permission to delete this passage.');
            }

            setMessage('✅ Passage deleted successfully.');
            await loadPassages();
        } catch (err) {
            console.error('Delete error:', err);
            setMessage('❌ Failed: ' + err.message);
            alert('Delete failed: ' + err.message + '\n\nThis is likely due to database permissions (RLS policies).\n\nPlease check browser console (F12) for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="passage-manager">
            <div className="manager-header">
                <h2>📖 Passage Management</h2>
                <button className="btn-create" onClick={handleCreateNew}>
                    ➕ Create New Passage
                </button>
            </div>

            {message && (
                <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            {isCreating ? (
                <div className="passage-editor">
                    <h3>{selectedPassage ? 'Edit Passage' : 'Create New Passage'}</h3>

                    <div className="form-row">
                        <div className="form-group">
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

                        <div className="form-group">
                            <label>Exam Type</label>
                            <select name="exam_type" value={passageForm.exam_type} onChange={handleInputChange}>
                                <option value="Academic">Academic</option>
                                <option value="General Training">General Training</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Difficulty</label>
                            <select name="difficulty" value={passageForm.difficulty} onChange={handleInputChange}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>


                    <div className="form-group">
                        <label>Passage Content (HTML Supported) *</label>
                        <div className="rich-toolbar">
                            <button onClick={() => insertTag('p')}>Paragraph</button>
                            <button onClick={() => insertTag('lead')}>Lead Text</button>
                            <button onClick={() => insertTag('header')}>Section Head</button>
                            <button onClick={() => insertTag('letter')}>Letter (A)</button>
                            <button onClick={() => insertTag('marker')}>Marker [1]</button>
                            <button onClick={() => insertTag('highlight')}>Highlight</button>
                            <button onClick={() => insertTag('center')}>Center</button>
                            <button onClick={() => insertTag('right')}>Right</button>
                            <button onClick={() => insertTag('justify')}>Justify</button>
                            <button onClick={() => insertTag('indent')}>Indent</button>
                            <button onClick={() => insertTag('table')}>Table</button>
                            <span className="toolbar-hint">Academic Formatting Tools</span>
                        </div>
                        <div className="editor-split">
                            <textarea
                                name="content"
                                value={passageForm.content}
                                onChange={handleInputChange}
                                rows={20}
                                placeholder="Paste or type the reading passage here..."
                                required
                            />
                            <div className="passage-live-preview">
                                <div className="preview-label">Live Preview</div>
                                <div
                                    className="preview-content"
                                    dangerouslySetInnerHTML={{ __html: passageForm.content }}
                                />
                            </div>
                        </div>
                        <div className="word-count-display">
                            📊 Word Count: <strong>{passageForm.word_count}</strong> words
                        </div>
                    </div>

                    <div className="editor-actions">
                        <button className="btn-save" onClick={handleSave} disabled={loading}>
                            {loading ? '💾 Saving...' : '💾 Save Passage'}
                        </button>
                        <button className="btn-cancel" onClick={() => setIsCreating(false)}>
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="passages-list">
                    <h3>Saved Passages ({passages.length})</h3>

                    {passages.length === 0 ? (
                        <div className="empty-state">
                            <p>📭 No passages yet. Create your first passage to get started!</p>
                        </div>
                    ) : (
                        <div className="passages-grid">
                            {passages.map(passage => (
                                <div key={passage.id} className="passage-card">
                                    <div className="passage-header">
                                        <h4>{passage.title}</h4>
                                        <div className="passage-badges">
                                            <span className={`badge ${passage.difficulty.toLowerCase()}`}>
                                                {passage.difficulty}
                                            </span>
                                            <span className="badge exam-type">{passage.exam_type}</span>
                                        </div>
                                    </div>

                                    <div className="passage-meta">
                                        <span>📊 {passage.word_count} words</span>
                                        <span>📅 {new Date(passage.created_at).toLocaleDateString()}</span>
                                    </div>


                                    <div className="passage-preview">
                                        {passage.content.substring(0, 150)}...
                                    </div>

                                    <div className="passage-actions">
                                        <button className="btn-edit" onClick={() => handleEdit(passage)}>
                                            ✏️ Edit
                                        </button>
                                        <button type="button" className="btn-delete" onClick={(e) => handleDelete(passage.id, e)}>
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PassageManager;

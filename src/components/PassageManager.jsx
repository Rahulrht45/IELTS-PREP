import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import './PassageManager.css';

const PassageManager = () => {
    const navigate = useNavigate();
    const [passages, setPassages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
        navigate('/admin/passage-builder');
    };

    const handleEdit = (passageId) => {
        navigate(`/admin/passage-builder?id=${passageId}`);
    };

    const handleDelete = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!window.confirm('Move this passage to recycle bin?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('passages')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setMessage('✅ Passage moved to recycle bin.');
            await loadPassages();
        } catch (err) {
            console.error('Delete error:', err);
            setMessage('❌ Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="passage-list-view">
            <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        📖 Reading Passages
                        <span className="badge" style={{ background: '#3b82f6', fontSize: '0.9rem', padding: '4px 10px', borderRadius: '20px' }}>{passages.length}</span>
                    </h2>
                    <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Manage all your IELTS reading passages</p>
                </div>
                <button
                    className="add-new-btn"
                    onClick={handleCreateNew}
                >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Create New Passage
                </button>
            </div>

            {message && (
                <div className={`message ${message.includes('❌') ? 'error' : 'success'}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: message.includes('❌') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }}>
                    {message}
                </div>
            )}

            <div className="passages-table-container premium-glass" style={{
                padding: '1rem',
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--admin-sidebar-bg)', zIndex: 10 }}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Title</th>
                            <th style={{ padding: '12px' }}>Section</th>
                            <th style={{ padding: '12px' }}>Type</th>
                            <th style={{ padding: '12px' }}>Difficulty</th>
                            <th style={{ padding: '12px' }}>Words</th>
                            <th style={{ padding: '12px' }}>Created</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {passages.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                    📭 No passages yet. Click "Create New Passage" to start!
                                </td>
                            </tr>
                        ) : (
                            passages.map(passage => (
                                <tr key={passage.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>#{passage.id.substring(0, 6)}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '600' }}>{passage.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {passage.content.replace(/<[^>]*>/g, '').substring(0, 60)}...
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {passage.section || 'Reading'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {passage.exam_type || 'Academic'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`badge ${passage.difficulty.toLowerCase()}`} style={{
                                            background: passage.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.1)' :
                                                passage.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                            color: passage.difficulty === 'Easy' ? '#10b981' :
                                                passage.difficulty === 'Hard' ? '#ef4444' : '#fbbf24',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {passage.difficulty}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#94a3b8' }}>{passage.word_count || 0}</td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                        {new Date(passage.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEdit(passage.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginRight: '8px' }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(passage.id, e)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PassageManager;

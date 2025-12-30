import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import PassageManager from '../../components/PassageManager';
import AIQuestionGenerator from '../../components/AIQuestionGenerator';
import './AdminPanel.css';
import './AdminPanelToolbar.css';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('questions'); // 'questions', 'passages', 'ai-generator'
    const [selectedPassageId, setSelectedPassageId] = useState('');
    const [linkedQuestions, setLinkedQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [deletedItems, setDeletedItems] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    // Topic Hierarchy Definition
    const TOPIC_STRUCTURE = {
        Speaking: {
            "Part 1: Introduction": ["Work & Study", "Hobbies & Interests", "Daily Life & Routine", "Family & Friends"],
            "Part 2: Cue Card": ["Describe a Person", "Describe a Place", "Describe an Event", "Describe an Object"],
            "Part 3: Discussion": ["Opinion Questions", "Speculative Questions", "Compare & Contrast"]
        },
        Writing: {
            "Task 1: Academic": ["Graph & Chart Analysis", "Table Description", "Process Explanation", "Map & Diagram"],
            "Task 1: General": ["Formal Letter", "Semi-formal Letter", "Informal Letter"],
            "Task 2: Essay": ["Opinion / Agree-Disagree", "Discussion Essay", "Problem-Solution", "Advantages-Disadvantages"]
        },
        Reading: {
            "Multiple Choice": ["Single Answer Questions", "Multiple Answer Questions", "Sentence Ending Match"],
            "True/False Assessment": ["True / False / Not Given", "Yes / No / Not Given"],
            "Matching Tasks": ["Heading Matching", "Information Matching", "Feature Matching"],
            "Completion Tasks": ["Sentence Completion", "Summary Completion", "Note Completion", "Table Completion", "Flowchart Completion", "Diagram Labeling"],
            "Short Answers": ["Short Answer Questions"]
        },
        Listening: {
            "Section 1: Conversation": ["Booking & Reservations", "Service Information", "General Inquiries"],
            "Section 2: Monologue": ["Tour Guide Speech", "Public Announcements", "Facility Information"],
            "Section 3: Discussion": ["Group Discussions", "Tutorial Conversations", "Study Planning"],
            "Section 4: Lecture": ["Academic Lectures", "Research Presentations", "Educational Talks"],
            "Question Types": ["Multiple Choice", "Matching Tasks", "Map/Diagram Labeling", "Form/Note Completion", "Sentence Completion", "Short Answer Questions"]
        }
    };

    const [formData, setFormData] = useState({
        section: 'Reading',
        category: 'Multiple Choice',
        topic: 'Single Answer Questions',
        question_type: 'MCQ',
        text: '',
        instructions: '',
        passage: '',
        audio_url: '',
        image_url: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'Medium',
        word_limit: '',
        score: 1
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadPassages();
    }, []);

    useEffect(() => {
        if (selectedPassageId) {
            loadLinkedQuestions();
        } else {
            setLinkedQuestions([]);
        }
    }, [selectedPassageId]);

    const loadPassages = async () => {
        try {
            const { data } = await supabase
                .from('passages')
                .select('id, title')
                .is('deleted_at', null) // Only show non-deleted passages
                .order('created_at', { ascending: false });
            setPassages(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLinkedQuestions = async () => {
        try {
            const { data } = await supabase
                .from('questions')
                .select('*')
                .eq('passage_id', selectedPassageId)
                .is('deleted_at', null) // Only show non-deleted questions
                .order('display_order', { ascending: true });
            setLinkedQuestions(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMove = async (index, direction) => {
        const newQuestions = [...linkedQuestions];
        const nextIndex = direction === 'up' ? index - 1 : index + 1;

        if (nextIndex < 0 || nextIndex >= newQuestions.length) return;

        // Swap
        [newQuestions[index], newQuestions[nextIndex]] = [newQuestions[nextIndex], newQuestions[index]];

        // Update display_order for all
        const updates = newQuestions.map((q, i) => ({
            id: q.id,
            display_order: i
        }));

        setLinkedQuestions(newQuestions);

        try {
            for (const update of updates) {
                await supabase.from('questions').update({ display_order: update.display_order }).eq('id', update.id);
            }
        } catch (err) {
            console.error('Error reordering:', err);
        }
    };

    const handleSoftDeleteQuestion = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            console.log('Starting delete process for question:', id);

            // 1. Check Auth (Double check)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Session expired. Please log in again.');
                return;
            }

            // 2. Try Soft Delete
            const { data: softData, error: softError } = await supabase
                .from('questions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            if (softError) {
                console.error('Soft delete failed:', softError);
                // Fallthrough to try hard delete or throw? 
                // Usually soft delete fail means permission or constraint.
            }

            // If soft delete passed and returned rows
            if (!softError && softData && softData.length > 0) {
                console.log('Soft delete successful:', softData);
                setMessage('✅ Question moved to recycle bin.');

                // Optimistically update UI to feel faster
                setLinkedQuestions(prev => prev.filter(q => q.id !== id));

                // Then fetch strict
                await loadLinkedQuestions();
                return;
            }

            // 3. Logic for Hard Delete (Fallback) or if Soft Delete returned 0 rows (already deleted?)
            console.warn('Soft delete affected 0 rows or failed. Attempting hard delete...');

            const { data: hardData, error: hardError } = await supabase
                .from('questions')
                .delete()
                .eq('id', id)
                .select();

            if (hardError) {
                console.error('Hard delete error:', hardError);
                throw new Error(hardError.message);
            }

            if (hardData && hardData.length > 0) {
                console.log('Hard delete successful:', hardData);
                setMessage('🗑️ Question permanently deleted.');
                setLinkedQuestions(prev => prev.filter(q => q.id !== id));
                await loadLinkedQuestions();
                return;
            }

            // If we get here, neither worked
            throw new Error('Database delete operation returned 0 rows. Please refresh the page and try again.');

        } catch (err) {
            console.error('Delete flow error:', err);
            setMessage('❌ Error: ' + err.message);
            alert(`Failed to delete: ${err.message}\nCheck console for details.`);
        }
    };

    // --- RECYCLE BIN LOGIC ---
    const loadDeletedItems = async () => {
        setLoading(true);
        try {
            // Fetch deleted passages
            const { data: pData, error: pError } = await supabase
                .from('passages')
                .select('id, title, deleted_at')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            if (pError) throw pError;

            // Fetch deleted questions
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('id, content, deleted_at')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            if (qError) throw qError;

            const combined = [
                ...(pData || []).map(p => ({ ...p, type: 'passage', name: p.title })),
                ...(qData || []).map(q => ({ ...q, type: 'question', name: q.content?.text?.substring(0, 50) + '...' }))
            ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

            setDeletedItems(combined);
        } catch (err) {
            console.error("Error loading bin:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id, type) => {
        try {
            const table = type === 'passage' ? 'passages' : 'questions';
            const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
            if (error) throw error;
            setMessage(`♻️ ${type} restored successfully!`);
            loadDeletedItems();
            loadPassages(); // Refresh lists
        } catch (err) {
            console.error(err);
            setMessage('Error restoring item.');
        }
    };

    const handleForceDelete = async (id, type) => {
        if (!window.confirm('PERMANENTLY DELETE? This cannot be undone.')) return;
        try {
            const table = type === 'passage' ? 'passages' : 'questions';
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            setMessage('🗑️ Item permanently deleted.');
            loadDeletedItems();
        } catch (err) {
            console.error(err);
            setMessage('Error deleting item.');
        }
    };

    const emptyTrash = async () => {
        if (!window.confirm('Delete all items older than 30 days?')) return;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const toDelete = deletedItems.filter(item => new Date(item.deleted_at) < thirtyDaysAgo);
            let count = 0;
            if (toDelete.length === 0) {
                setMessage('No items older than 30 days found.');
                return;
            }
            for (const item of toDelete) {
                const table = item.type === 'passage' ? 'passages' : 'questions';
                await supabase.from(table).delete().eq('id', item.id);
                count++;
            }
            setMessage(`cleaned up ${count} old items.`);
            loadDeletedItems();
        } catch (err) {
            console.error(err);
        }
    };

    const getCategories = (section) => Object.keys(TOPIC_STRUCTURE[section] || {});
    const getTopics = (section, category) => TOPIC_STRUCTURE[section]?.[category] || [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'section') {
                const firstCat = getCategories(value)[0];
                const firstTopic = getTopics(value, firstCat)[0];
                newData.category = firstCat;
                newData.topic = firstTopic;
            } else if (name === 'category') {
                const firstTopic = getTopics(prev.section, value)[0];
                newData.topic = firstTopic;
            }
            return newData;
        });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const insertQuestionTag = (tag) => {
        const textarea = document.querySelector('textarea[name="text"]');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.text;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let newText;

        // IELTS Question Formatting Templates
        if (tag === 'box') {
            newText = `${before}<div class="q-summary-box">
  <h4 class="text-center">Title Here</h4>
  <ul>
    <li>Text here <span class="exam-marker">1</span></li>
  </ul>
</div>${after}`;
        }
        else if (tag === 'mcq-template') {
            newText = `${before}<div class="mcq-template">
  <p><strong>A.</strong> First option</p>
  <p><strong>B.</strong> Second option</p>
  <p><strong>C.</strong> Third option</p>
  <p><strong>D.</strong> Fourth option</p>
</div>${after}`;
        }
        else if (tag === 'matching-table') {
            newText = `${before}<table class="exam-table matching-table">
  <thead>
    <tr>
      <th>Item</th>
      <th>Match</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="exam-marker">1</span> Description A</td>
      <td>Option i</td>
    </tr>
    <tr>
      <td><span class="exam-marker">2</span> Description B</td>
      <td>Option ii</td>
    </tr>
    <tr>
      <td><span class="exam-marker">3</span> Description C</td>
      <td>Option iii</td>
    </tr>
  </tbody>
</table>${after}`;
        }
        else if (tag === 'diagram') {
            newText = `${before}<div class="diagram-container">
  <div class="diagram-box">
    <p class="text-center"><strong>Diagram Title</strong></p>
    <p>Label <span class="exam-marker">1</span>: <span class="exam-gap-display">__________</span></p>
    <p>Label <span class="exam-marker">2</span>: <span class="exam-gap-display">__________</span></p>
  </div>
</div>${after}`;
        }
        else if (tag === 'flow-chart') {
            newText = `${before}<div class="flow-chart">
  <div class="flow-step">Step 1 → <span class="exam-gap-display">__________</span></div>
  <div class="flow-arrow">↓</div>
  <div class="flow-step">Step 2 → <span class="exam-gap-display">__________</span></div>
  <div class="flow-arrow">↓</div>
  <div class="flow-step">Step 3 → <span class="exam-gap-display">__________</span></div>
</div>${after}`;
        }
        else if (tag === 'completion-table') {
            newText = `${before}<table class="exam-table completion-table">
  <tr>
    <td>Question <span class="exam-marker">1</span></td>
    <td><span class="exam-gap-display">__________</span></td>
  </tr>
  <tr>
    <td>Question <span class="exam-marker">2</span></td>
    <td><span class="exam-gap-display">__________</span></td>
  </tr>
</table>${after}`;
        }
        else if (tag === 'note-completion') {
            newText = `${before}<div class="note-completion">
  <h4>Complete the notes below</h4>
  <p>The main cause is <span class="exam-gap-display">__________</span> <span class="exam-marker">1</span></p>
  <p>This leads to <span class="exam-gap-display">__________</span> <span class="exam-marker">2</span></p>
</div>${after}`;
        }
        // Basic formatting
        else if (tag === 'p') newText = `${before}<p>${selected || 'Paragraph text'}</p>${after}`;
        else if (tag === 'h3') newText = `${before}<h3>${selected || 'Section Header'}</h3>${after}`;
        else if (tag === 'h4') newText = `${before}<h4>${selected || 'Sub-header'}</h4>${after}`;
        else if (tag === 'bullet') newText = `${before}<li>${selected || 'Bullet point text'}</li>${after}`;
        else if (tag === 'b') newText = `${before}<strong>${selected}</strong>${after}`;
        else if (tag === 'i') newText = `${before}<em>${selected}</em>${after}`;
        else if (tag === 'u') newText = `${before}<u>${selected}</u>${after}`;
        else if (tag === 'center') newText = `${before}<div class="text-center">${selected}</div>${after}`;
        else if (tag === 'right') newText = `${before}<div class="text-right">${selected}</div>${after}`;
        else if (tag === 'highlight') newText = `${before}<span class="exam-highlight">${selected}</span>${after}`;
        else if (tag === 'marker') newText = `${before}<span class="exam-marker">1</span>${after}`;
        else if (tag === 'gap') newText = `${before}<span class="exam-gap-display">__________</span>${after}`;
        else if (tag === 'letter') newText = `${before}<span class="exam-section-letter">A</span>${after}`;
        else if (tag === 'ul') newText = `${before}<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>${after}`;
        else if (tag === 'ol') newText = `${before}<ol>\n  <li>First item</li>\n  <li>Second item</li>\n</ol>${after}`;
        else if (tag === 'basic-table') {
            newText = `${before}<table class="exam-table">
  <tr>
    <th>Header 1</th>
    <th>Header 2</th>
  </tr>
  <tr>
    <td>Data 1</td>
    <td>Data 2</td>
  </tr>
</table>${after}`;
        }

        setFormData(prev => ({ ...prev, text: newText }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to add questions.');

            const content = {
                text: formData.text,
                instructions: formData.instructions,
                passage: formData.passage,
                category: formData.category,
                topic: formData.topic,
                audio_url: formData.audio_url || null,
                image_url: formData.image_url || null
            };

            const { error } = await supabase
                .from('questions')
                .insert([{
                    section: formData.section,
                    question_type: formData.question_type,
                    content: content,
                    passage_id: formData.section === 'Reading' ? selectedPassageId : null,
                    options: formData.question_type === 'MCQ' ? formData.options : null,
                    correct_answer: formData.correct_answer,
                    explanation: formData.explanation,
                    difficulty: formData.difficulty,
                    word_limit: formData.word_limit ? parseInt(formData.word_limit) : null,
                    score: parseInt(formData.score) || 1,
                    display_order: linkedQuestions.length,
                    user_id: user.id
                }]);

            if (error) throw error;

            setMessage('✅ Question added successfully!');
            if (selectedPassageId) loadLinkedQuestions();
            setFormData(prev => ({
                ...prev,
                text: '',
                correct_answer: '',
                explanation: '',
                options: ['', '', '', ''],
                word_limit: ''
            }));

        } catch (err) {
            console.error('Error adding question:', err);
            setMessage('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-panel-container">
            {/* ... (header and tabs remain same) ... */}
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <button
                    className="ai-classifier-btn"
                    onClick={() => navigate('/ai-classifier')}
                >
                    🤖 AI Question Classifier
                </button>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('questions')}
                >
                    ❓ Questions
                </button>
                <button
                    className={`tab-btn ${activeTab === 'passages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('passages')}
                >
                    📖 Passages
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ai-generator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai-generator')}
                >
                    🤖 AI Generator
                </button>
                <button
                    className={`tab-btn ${activeTab === 'recycle-bin' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('recycle-bin'); loadDeletedItems(); }}
                >
                    🗑️ Recycle Bin
                </button>
            </div>

            {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

            {activeTab === 'questions' && (
                <div className="builder-layout">
                    {formData.section === 'Reading' && (
                        <div className="builder-sidebar premium-glass">
                            <h3>Reading Builder</h3>
                            <div className="form-group">
                                <label>1. Select Primary Passage</label>
                                <select
                                    value={selectedPassageId}
                                    onChange={(e) => setSelectedPassageId(e.target.value)}
                                    className="passage-select"
                                >
                                    <option value="">-- Choose a Passage --</option>
                                    {passages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>

                            {selectedPassageId && (
                                <div className="linked-questions-panel">
                                    <div className="panel-header">
                                        <h4>Linked Questions ({linkedQuestions.length})</h4>
                                        <button
                                            className="preview-btn-sm"
                                            onClick={() => window.open(`/reading-test/${selectedPassageId}`, '_blank')}
                                        >
                                            👁️ Live Preview
                                        </button>
                                    </div>
                                    <div className="question-mini-list">
                                        {linkedQuestions.map((q, i) => (
                                            <div key={q.id} className="mini-q-item">
                                                <span className="q-num">{i + 1}</span>
                                                <div className="mini-q-info">
                                                    <span className="q-type-badge">{q.question_type}</span>
                                                    <p className="q-preview-text">{q.content?.text?.substring(0, 30)}...</p>
                                                </div>
                                                <div className="mini-q-actions">
                                                    <button type="button" onClick={() => handleMove(i, 'up')} disabled={i === 0}>↑</button>
                                                    <button type="button" onClick={() => handleMove(i, 'down')} disabled={i === linkedQuestions.length - 1}>↓</button>
                                                    <button type="button" className="btn-del-mini" onClick={(e) => handleSoftDeleteQuestion(q.id, e)} title="Move to Recycle Bin">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                        {linkedQuestions.length === 0 && <p className="empty-mini">No questions linked yet.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={`admin-form ${formData.section === 'Reading' ? 'form-in-builder' : ''}`}>
                        <div className="form-group">
                            <label>Section</label>
                            <select name="section" value={formData.section} onChange={handleChange}>
                                <option value="Reading">Reading</option>
                                <option value="Listening">Listening</option>
                                <option value="Writing">Writing</option>
                                <option value="Speaking">Speaking</option>
                            </select>
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    {getCategories(formData.section).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Topic</label>
                                <select name="topic" value={formData.topic} onChange={handleChange}>
                                    {getTopics(formData.section, formData.category).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Question Format (System)</label>
                                <select name="question_type" value={formData.question_type} onChange={handleChange}>
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="T/F/NG">True/False/Not Given</option>
                                    <option value="Y/N/NG">Yes/No/Not Given</option>
                                    <option value="GapFill">Gap Fill / Completion</option>
                                    <option value="Matching">Matching</option>
                                    <option value="ShortAnswer">Short Answer</option>
                                    <option value="Essay">Essay (Writing Task 2)</option>
                                    <option value="Letter">Letter (Writing Task 1)</option>
                                    <option value="Part1">Speaking Part 1</option>
                                    <option value="Part2">Speaking Part 2 (Cue Card)</option>
                                    <option value="Part3">Speaking Part 3</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Difficulty</label>
                                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Instructions (e.g., "NO MORE THAN TWO WORDS")</label>
                                <input
                                    type="text"
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleChange}
                                    placeholder='Specific exam instructions...'
                                    className="instructions-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Word Limit</label>
                                <input
                                    type="number"
                                    name="word_limit"
                                    value={formData.word_limit}
                                    onChange={handleChange}
                                    placeholder='e.g. 2'
                                />
                            </div>
                            <div className="form-group">
                                <label>Points/Score</label>
                                <input
                                    type="number"
                                    name="score"
                                    value={formData.score}
                                    onChange={handleChange}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Question Content (HTML Supported) *</label>
                            <div className="rich-toolbar">
                                {/* IELTS Question Templates */}
                                <div className="toolbar-group">
                                    <span className="toolbar-label">📋 Templates</span>
                                    <button type="button" onClick={() => insertQuestionTag('box')}>Summary Box</button>
                                    <button type="button" onClick={() => insertQuestionTag('mcq-template')}>MCQ (A-D)</button>
                                    <button type="button" onClick={() => insertQuestionTag('matching-table')}>Matching Table</button>
                                    <button type="button" onClick={() => insertQuestionTag('completion-table')}>Completion Table</button>
                                    <button type="button" onClick={() => insertQuestionTag('diagram')}>Diagram</button>
                                    <button type="button" onClick={() => insertQuestionTag('flow-chart')}>Flow Chart</button>
                                    <button type="button" onClick={() => insertQuestionTag('note-completion')}>Note Completion</button>
                                </div>

                                {/* Text Formatting */}
                                <div className="toolbar-group">
                                    <span className="toolbar-label">✍️ Format</span>
                                    <button type="button" onClick={() => insertQuestionTag('p')}>Paragraph</button>
                                    <button type="button" onClick={() => insertQuestionTag('h3')}>Header</button>
                                    <button type="button" onClick={() => insertQuestionTag('h4')}>Sub-header</button>
                                    <button type="button" onClick={() => insertQuestionTag('b')}>Bold</button>
                                    <button type="button" onClick={() => insertQuestionTag('i')}>Italic</button>
                                    <button type="button" onClick={() => insertQuestionTag('u')}>Underline</button>
                                    <button type="button" onClick={() => insertQuestionTag('highlight')}>Highlight</button>
                                </div>

                                {/* Lists & Alignment */}
                                <div className="toolbar-group">
                                    <span className="toolbar-label">📝 Lists</span>
                                    <button type="button" onClick={() => insertQuestionTag('ul')}>Bullet List</button>
                                    <button type="button" onClick={() => insertQuestionTag('ol')}>Numbered List</button>
                                    <button type="button" onClick={() => insertQuestionTag('bullet')}>+ Bullet Item</button>
                                    <button type="button" onClick={() => insertQuestionTag('center')}>Center</button>
                                    <button type="button" onClick={() => insertQuestionTag('right')}>Right Align</button>
                                </div>

                                {/* Special IELTS Elements */}
                                <div className="toolbar-group">
                                    <span className="toolbar-label">🎯 IELTS</span>
                                    <button type="button" onClick={() => insertQuestionTag('marker')}>Marker (1)</button>
                                    <button type="button" onClick={() => insertQuestionTag('gap')}>Gap (___)</button>
                                    <button type="button" onClick={() => insertQuestionTag('letter')}>Letter (A)</button>
                                    <button type="button" onClick={() => insertQuestionTag('basic-table')}>Basic Table</button>
                                </div>
                            </div>
                            <div className="editor-preview-split">
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter the actual question statement..."
                                    rows={8}
                                />
                                <div className="q-preview-live">
                                    <div className="preview-label">📱 Live Student View Preview</div>
                                    <div className="preview-body-q">
                                        {/* Section & Type Badge */}
                                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className="badge" style={{ background: 'var(--primary-blue)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                                {formData.section}
                                            </span>
                                            <span className="badge" style={{ background: 'var(--primary-green)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                                {formData.question_type}
                                            </span>
                                            <span className={`badge ${formData.difficulty.toLowerCase()}`} style={{ padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                                {formData.difficulty}
                                            </span>
                                        </div>

                                        {/* Instructions */}
                                        {formData.instructions && (
                                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid var(--primary-blue)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--primary-blue)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>📋 Instructions</div>
                                                <div style={{ fontWeight: '700' }}>{formData.instructions}</div>
                                            </div>
                                        )}

                                        {/* Strategy Hint */}
                                        {formData.strategy && (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--primary-green)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--primary-green)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>💡 Strategy</div>
                                                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{formData.strategy}</div>
                                            </div>
                                        )}

                                        {/* Question Content */}
                                        <div style={{ marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: formData.text || '<span style="color: var(--text-muted)">Question content will appear here...</span>' }} />


                                        {/* Correct Answer */}
                                        {formData.correct_answer && (
                                            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--primary-green)', borderRadius: '10px' }}>
                                                <span style={{ fontWeight: '800', color: 'var(--primary-green)' }}>✓ Correct Answer: </span>
                                                <span style={{ fontWeight: '700' }}>{formData.correct_answer}</span>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {formData.explanation && (
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-sidebar)', borderLeft: '4px solid var(--primary-blue)', borderRadius: '8px' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--primary-blue)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>📝 Explanation</div>
                                                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{formData.explanation}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {formData.section !== 'Reading' && (
                            <div className="form-group">
                                <label>
                                    {formData.section === 'Listening' && 'Audio Transcript (Optional)'}
                                    {formData.section === 'Writing' && 'Task Instructions / Context'}
                                    {formData.section === 'Speaking' && 'Topic Card / Prompts'}
                                </label>
                                <textarea
                                    name="passage"
                                    value={formData.passage}
                                    onChange={handleChange}
                                    placeholder="Context for non-reading sections..."
                                    rows={8}
                                />
                            </div>
                        )}

                        {(formData.section === 'Writing' || formData.section === 'Listening' || formData.section === 'Reading') && (
                            <div className="form-group">
                                <label>Image / Diagram URL (Optional) 🖼️</label>
                                <input
                                    type="text"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/chart.png"
                                    className="url-input"
                                />
                            </div>
                        )}

                        {formData.section === 'Listening' && (
                            <div className="form-group">
                                <label>Audio URL 🎧</label>
                                <input
                                    type="text"
                                    name="audio_url"
                                    value={formData.audio_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/audio.mp3"
                                    className="url-input"
                                />
                            </div>
                        )}


                        <div className="form-group">
                            <label>Correct Answer</label>
                            <input
                                type="text"
                                name="correct_answer"
                                value={formData.correct_answer}
                                onChange={handleChange}
                                required
                                placeholder="Correct answer text..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Explanation / Rationalization</label>
                            <textarea
                                name="explanation"
                                value={formData.explanation}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Explain why this is correct..."
                            />
                        </div>

                        <button type="submit" className="submit-btn-builder" disabled={loading || (formData.section === 'Reading' && !selectedPassageId)}>
                            {loading ? 'Adding...' : 'Add Question'}
                        </button>
                    </form>
                </div>
            )}

            {/* Passages Tab */}
            {activeTab === 'passages' && (
                <PassageManager />
            )}

            {/* AI Generator Tab */}
            {/* AI Generator Tab */}
            {activeTab === 'ai-generator' && (
                <AIQuestionGenerator />
            )}

            {/* Recycle Bin Tab */}
            {activeTab === 'recycle-bin' && (
                <div className="form-in-builder">
                    <div className="admin-header" style={{ marginBottom: '1rem' }}>
                        <h3>🗑️ Recycle Bin</h3>
                        <button className="submit-btn-builder" style={{ width: 'auto', background: '#ef4444' }} onClick={emptyTrash}>
                            Clean Old Items (30+ Days)
                        </button>
                    </div>

                    {deletedItems.length === 0 ? (
                        <p className="text-center text-muted">Recycle bin is empty.</p>
                    ) : (
                        <div className="recycle-list">
                            {deletedItems.map((item) => (
                                <div key={item.id} className="mini-q-item" style={{ marginBottom: '0.5rem' }}>
                                    <span className={`q-type-badge ${item.type === 'passage' ? 'passage-badge' : ''}`}>
                                        {item.type.toUpperCase()}
                                    </span>
                                    <div className="mini-q-info">
                                        <h4>{item.name}</h4>
                                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Deleted: {new Date(item.deleted_at).toLocaleString()}</p>
                                    </div>
                                    <div className="mini-q-actions" style={{ flexDirection: 'row' }}>
                                        <button className="preview-btn-sm" onClick={() => handleRestore(item.id, item.type)}>Restore</button>
                                        <button className="preview-btn-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleForceDelete(item.id, item.type)}>Delete</button>
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

export default AdminPanel;

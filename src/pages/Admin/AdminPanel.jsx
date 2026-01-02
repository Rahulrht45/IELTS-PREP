import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import SmartText from '../../components/SmartText';

// Components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import DashboardOverview from './components/DashboardOverview';
import PassageManager from '../../components/PassageManager';
import AIQuestionGenerator from '../../components/AIQuestionGenerator';
import ExamMaker from './components/ExamMaker';

// Styles
import './AdminPanel.css';
import './AdminPanelList.css'; // New professional list styles
import './AdminPanelToolbar.css';

const LivePreviewInput = ({ type, options }) => {
    if (type === 'MCQ') {
        return (
            <div className="options-list">
                {options.map((opt, idx) => (
                    <div key={idx} className="option-item">
                        <div className="radio-circle"></div>
                        <span>
                            <SmartText
                                text={opt}
                                onLookup={(word, e) => {
                                    e.stopPropagation();
                                    alert(`Vocab Lookup: ${word}`);
                                }}
                            />
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    if (type === 'T/F/NG') {
        return (
            <div className="tfng-options-grid">
                {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                    <div key={opt} className="tfng-btn">{opt}</div>
                ))}
            </div>
        );
    }
    if (type === 'Y/N/NG') {
        return (
            <div className="tfng-options-grid">
                {['YES', 'NO', 'NOT GIVEN'].map(opt => (
                    <div key={opt} className="tfng-btn">{opt}</div>
                ))}
            </div>
        );
    }
    if (['Essay', 'Letter', 'Part1', 'Part2', 'Part3'].includes(type)) {
        return (
            <textarea
                className="text-area-preview"
                rows={6}
                disabled
                placeholder="[Student Answer Area]"
            />
        );
    }
    // Default
    return (
        <input
            type="text"
            className="text-input-preview"
            disabled
            placeholder="[Student Answer Input]"
        />
    );
};

const AdminPanel = ({ currentTheme, onToggleTheme }) => {
    const navigate = useNavigate();

    // View State
    const [activeView, setActiveView] = useState('dashboard'); // mapped from sidebar IDs
    const [user, setUser] = useState(null);

    // Existing State for Question Builder
    const [selectedPassageId, setSelectedPassageId] = useState('');
    const [linkedQuestions, setLinkedQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [deletedItems, setDeletedItems] = useState([]);

    // List View State
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'builder'
    const [questionList, setQuestionList] = useState([]);
    const [listFilter, setListFilter] = useState('All');
    const [fetchingList, setFetchingList] = useState(false);

    // Form and Data State
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    // Creation Drawer State
    const [isCreationDrawerOpen, setIsCreationDrawerOpen] = useState(false);
    const [creationSection, setCreationSection] = useState('Reading'); // Default for drawer

    const QUESTION_TYPES_CONFIG = {
        Reading: [
            { id: 'MCQ', label: 'Multiple Choice', icon: '📝' },
            { id: 'T/F/NG', label: 'True/False/Not Given', icon: '✅' },
            { id: 'Y/N/NG', label: 'Yes/No/Not Given', icon: '🤔' },
            { id: 'GapFill', label: 'Gap Fill', icon: '🖊️' },
            { id: 'Matching', label: 'Matching Tasks', icon: '🔗' },
            { id: 'ShortAnswer', label: 'Short Answer', icon: '💬' }
        ],
        Listening: [
            { id: 'MCQ', label: 'Multiple Choice', icon: '🎧' },
            { id: 'GapFill', label: 'Form Completion', icon: '📝' },
            { id: 'Matching', label: 'Matching', icon: '🔗' },
            { id: 'ShortAnswer', label: 'Short Answer', icon: '💬' }
        ],
        Writing: [
            { id: 'Essay', label: 'Essay (Task 2)', icon: '✍️' },
            { id: 'Letter', label: 'Letter (Task 1)', icon: '✉️' }
        ],
        Speaking: [
            { id: 'Part1', label: 'Part 1 (Intro)', icon: '🗣️' },
            { id: 'Part2', label: 'Part 2 (Cue Card)', icon: '🃏' },
            { id: 'Part3', label: 'Part 3 (Discussion)', icon: '👥' }
        ]
    };

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

    // --- Effects ---
    useEffect(() => {
        loadPassages();
        checkUser();
    }, []);

    useEffect(() => {
        if (selectedPassageId) {
            loadLinkedQuestions();
        } else {
            setLinkedQuestions([]);
        }
    }, [selectedPassageId]);

    // Add view-based effects
    useEffect(() => {
        if (activeView === 'recycle-bin') {
            loadDeletedItems();
        }
        if (activeView === 'questions') {
            fetchQuestionList(formData.section);
            loadLinkedQuestions(); // Refresh sidebar too
        }
    }, [activeView, formData.section]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || { id: 'dev-user', email: 'dev@example.com' });
    };

    // --- Loading Functions ---
    const loadPassages = async () => {
        try {
            const { data } = await supabase
                .from('passages')
                .select('id, title')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            setPassages(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLinkedQuestions = async () => {
        try {
            let query = supabase
                .from('questions')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false }) // Show newest first
                .limit(20);

            if (selectedPassageId) {
                query = query.eq('passage_id', selectedPassageId).order('display_order', { ascending: true });
            } else {
                // If no passage, just show recent questions for this section
                query = query.eq('section', formData.section);
            }

            const { data } = await query;
            setLinkedQuestions(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestionList = async (section) => {
        setFetchingList(true);
        try {
            let query = supabase
                .from('questions')
                .select('*')
                .eq('section', section)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setQuestionList(data || []);
        } catch (err) {
            console.error('Error fetching list:', err);
        } finally {
            setFetchingList(false);
        }
    };

    // --- Handlers ---
    const handleMove = async (index, direction) => {
        const newQuestions = [...linkedQuestions];
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= newQuestions.length) return;
        [newQuestions[index], newQuestions[nextIndex]] = [newQuestions[nextIndex], newQuestions[index]];

        // Optimistic UI update
        const updates = newQuestions.map((q, i) => ({ id: q.id, display_order: i }));
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
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!window.confirm('Delete this question?')) return;

        try {
            const { error } = await supabase
                .from('questions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setMessage('✅ Question moved to recycle bin.');
            setLinkedQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            console.error(err);
            setMessage('Error deleting: ' + err.message);
        }
    };

    // Recycle Bin Logic
    const loadDeletedItems = async () => {
        setLoading(true);
        try {
            const { data: pData } = await supabase.from('passages').select('id, title, deleted_at').not('deleted_at', 'is', null);
            const { data: qData } = await supabase.from('questions').select('id, content, deleted_at').not('deleted_at', 'is', null);

            const combined = [
                ...(pData || []).map(p => ({ ...p, type: 'passage', name: p.title })),
                ...(qData || []).map(q => ({ ...q, type: 'question', name: q.content?.text?.substring(0, 50) + '...' }))
            ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

            setDeletedItems(combined);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id, type) => {
        try {
            const table = type === 'passage' ? 'passages' : 'questions';
            await supabase.from(table).update({ deleted_at: null }).eq('id', id);
            setMessage(`♻️ ${type} restored!`);
            loadDeletedItems(); // Refresh bin
            if (activeView === 'questions') loadPassages(); // Refresh passages if needed
        } catch (err) { console.error(err); }
    };



    const handleEditQuestion = (q) => {
        // Navigate to the full Question Builder page with the question ID
        navigate(`/admin/builder?id=${q.id}&section=${q.section}&type=${q.question_type}`);
    };

    const handleForceDelete = async (id, type) => {
        if (!window.confirm('PERMANENTLY DELETE?')) return;
        try {
            const table = type === 'passage' ? 'passages' : 'questions';
            await supabase.from(table).delete().eq('id', id);
            loadDeletedItems();
        } catch (err) { console.error(err); }
    };

    // Form Handlers
    const getCategories = (section) => Object.keys(TOPIC_STRUCTURE[section] || {});
    const getTopics = (section, category) => TOPIC_STRUCTURE[section]?.[category] || [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'section') {
                const firstCat = getCategories(value)[0];
                newData.category = firstCat;
                newData.topic = getTopics(value, firstCat)[0];
            } else if (name === 'category') {
                newData.topic = getTopics(prev.section, value)[0];
            }
            return newData;
        });
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

        if (tag === 'box') {
            newText = `${before}<div class="q-summary-box">\n  <h4 class="text-center">Title Here</h4>\n  <ul>\n    <li>Text here <span class="exam-marker">1</span></li>\n  </ul>\n</div>${after}`;
        }
        else if (tag === 'mcq-template') {
            newText = `${before}<div class="mcq-template">\n  <p><strong>A.</strong> First option</p>\n  <p><strong>B.</strong> Second option</p>\n  <p><strong>C.</strong> Third option</p>\n  <p><strong>D.</strong> Fourth option</p>\n</div>${after}`;
        }
        else if (tag === 'matching-table') {
            newText = `${before}<table class="exam-table matching-table">\n  <thead>\n    <tr>\n      <th>Item</th>\n      <th>Match</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td><span class="exam-marker">1</span> Description A</td>\n      <td>Option i</td>\n    </tr>\n  </tbody>\n</table>${after}`;
        }
        else if (tag === 'completion-table') {
            newText = `${before}<table class="exam-table completion-table">\n  <tbody>\n    <tr>\n      <th>Category</th>\n      <th>Details</th>\n    </tr>\n    <tr>\n      <td>Topic A</td>\n      <td><span class="exam-gap-display">__________</span></td>\n    </tr>\n  </tbody>\n</table>${after}`;
        }
        else if (tag === 'diagram') {
            newText = `${before}<div class="diagram-container text-center">\n  <img src="placeholder.jpg" alt="Diagram" style="max-width:100%"/>\n  <div class="label-group">\n    <span class="exam-marker">1</span> Label here\n  </div>\n</div>${after}`;
        }
        else if (tag === 'flow-chart') {
            newText = `${before}<div class="flow-chart">\n  <div class="flow-step">Step 1</div>\n  <div class="flow-arrow">↓</div>\n  <div class="flow-step">Step 2: <span class="exam-gap-display">__________</span></div>\n</div>${after}`;
        }
        else if (tag === 'note-completion') {
            newText = `${before}<div class="note-completion">\n  <h4>Notes:</h4>\n  <ul>\n    <li>Topic point: <span class="exam-gap-display">__________</span></li>\n    <li>Another point...</li>\n  </ul>\n</div>${after}`;
        }
        else if (tag === 'p') newText = `${before}<p>${selected || 'text'}</p>${after}`;
        else if (tag === 'h3') newText = `${before}<h3>${selected || 'Heading'}</h3>${after}`;
        else if (tag === 'h4') newText = `${before}<h4>${selected || 'Subheading'}</h4>${after}`;
        else if (tag === 'b') newText = `${before}<strong>${selected}</strong>${after}`;
        else if (tag === 'i') newText = `${before}<em>${selected}</em>${after}`;
        else if (tag === 'u') newText = `${before}<u>${selected}</u>${after}`;
        else if (tag === 'highlight') newText = `${before}<mark>${selected}</mark>${after}`;

        else if (tag === 'marker') newText = `${before}<span class="exam-marker">1</span>${after}`;
        else if (tag === 'gap') newText = `${before}<span class="exam-gap-display">__________</span>${after}`;
        else if (tag === 'letter') newText = `${before}<span class="exam-letter">(A)</span>${after}`;
        else if (tag === 'basic-table') newText = `${before}<table class="exam-table"><tr><th>Header</th></tr><tr><td>Data</td></tr></table>${after}`;

        else newText = before + selected + after;

        setFormData(prev => ({ ...prev, text: newText }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const content = {
                text: formData.text,
                instructions: formData.instructions,
                passage: formData.passage, // For non-reading types
                category: formData.category,
                topic: formData.topic,
                audio_url: formData.audio_url || null,
                image_url: formData.image_url || null
            };

            if (editingQuestionId) {
                // Update existing
                const { error } = await supabase
                    .from('questions')
                    .update({
                        section: formData.section,
                        question_type: formData.question_type,
                        content: content,
                        passage_id: selectedPassageId || null,
                        options: formData.question_type === 'MCQ' ? formData.options : null,
                        correct_answer: formData.correct_answer,
                        explanation: formData.explanation,
                        difficulty: formData.difficulty,
                        score: formData.score,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingQuestionId);

                if (error) throw error;
                setMessage('✅ Question updated successfully!');
            } else {
                // Create new
                const { error } = await supabase.from('questions').insert([{
                    section: formData.section,
                    question_type: formData.question_type,
                    content: content,
                    passage_id: selectedPassageId || null,
                    options: formData.question_type === 'MCQ' ? formData.options : null,
                    correct_answer: formData.correct_answer,
                    explanation: formData.explanation,
                    difficulty: formData.difficulty,
                    display_order: linkedQuestions.length,
                    user_id: user.id,
                    score: formData.score
                }]);

                if (error) throw error;
                setMessage('✅ Question added!');
            }

            if (selectedPassageId) loadLinkedQuestions();

            // Return to list if editing, otherwise reset for next input
            if (editingQuestionId) {
                setTimeout(() => {
                    setEditingQuestionId(null);
                    setViewMode('list');
                    fetchQuestionList(formData.section); // Refresh list
                }, 1000);
            } else {
                setFormData(prev => ({ ...prev, text: '', correct_answer: '', explanation: '' }));
            }
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER HELPERS ---

    // 1. Question Builder View (Full Fidelity)
    const renderQuestionBuilder = () => (
        <div className="builder-layout">
            <div className="builder-sidebar premium-glass">
                <h3>{formData.section} Builder</h3>
                <div className="form-group">
                    <label>1. Select Primary Context/Passage</label>
                    <select
                        value={selectedPassageId}
                        onChange={(e) => setSelectedPassageId(e.target.value)}
                        className="passage-select"
                    >
                        <option value="">-- Choose a Passage/Context --</option>
                        {passages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>

                <div className="linked-questions-panel">
                    <div className="panel-header">
                        <h4>{selectedPassageId ? `Linked Questions (${linkedQuestions.length})` : `Recent ${formData.section} Questions`}</h4>
                        {selectedPassageId && (
                            <button
                                className="preview-btn-sm"
                                onClick={() => window.open(`/reading-test/${selectedPassageId}`, '_blank')}
                            >
                                👁️ Live Preview
                            </button>
                        )}
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
                                    {selectedPassageId && (
                                        <>
                                            <button type="button" onClick={() => handleMove(i, 'up')} disabled={i === 0}>↑</button>
                                            <button type="button" onClick={() => handleMove(i, 'down')} disabled={i === linkedQuestions.length - 1}>↓</button>
                                        </>
                                    )}
                                    <button type="button" className="btn-edit-mini" onClick={() => handleEditQuestion(q)} title="Edit">✏️</button>
                                    <button type="button" className="btn-del-mini" onClick={(e) => handleSoftDeleteQuestion(q.id, e)} title="Move to Recycle Bin">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {linkedQuestions.length === 0 && <p className="empty-mini" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>No questions found.</p>}
                    </div>
                </div>
            </div>

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

                        {/* Special IELTS Elements */}
                        <div className="toolbar-group">
                            <span className="toolbar-label">🎯 IELTS</span>
                            <button type="button" onClick={() => insertQuestionTag('marker')}>Marker (1)</button>
                            <button type="button" onClick={() => insertQuestionTag('gap')}>Gap (___)</button>
                            <button type="button" onClick={() => insertQuestionTag('letter')}>Letter (A)</button>
                            <button type="button" onClick={() => insertQuestionTag('basic-table')}>Basic Table</button>
                        </div>
                    </div>

                    <div className="editor-preview-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <textarea
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            required
                            placeholder="Enter the actual question statement..."
                            rows={15}
                            style={{ resize: 'vertical' }}
                        />
                        <div className="q-preview-live" style={{
                            background: 'white',
                            color: '#0f172a',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            overflowY: 'auto',
                            height: '100%',
                            maxHeight: '400px',
                            border: '1px solid #cbd5e1'
                        }}>
                            <div className="preview-label" style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color: '#64748b',
                                fontWeight: '700',
                                marginBottom: '1rem',
                                borderBottom: '1px solid #e2e8f0',
                                paddingBottom: '0.5rem'
                            }}>📱 Live Student View Preview</div>

                            <div className="preview-body-q">
                                {/* Section & Type Badge */}
                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        {formData.section}
                                    </span>
                                    <span className="badge" style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        {formData.question_type}
                                    </span>
                                    <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        {formData.difficulty}
                                    </span>
                                </div>

                                {/* Instructions */}
                                {formData.instructions && (
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: '800', color: '#1d4ed8', marginBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>📋 Instructions</div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e40af' }}>{formData.instructions}</div>
                                    </div>
                                )}

                                {/* Question Content */}
                                <div style={{ marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                                    <SmartText
                                        text={formData.text || '<span style="color: #94a3b8; font-style: italic;">Start typing to see preview...</span>'}
                                        onLookup={(word, e) => {
                                            e.stopPropagation();
                                            alert(`Vocab Lookup: ${word}`);
                                        }}
                                    />
                                </div>

                                {/* Interactive Input Preview */}
                                <LivePreviewInput type={formData.question_type} options={formData.options} />

                                {/* Correct Answer Preview */}
                                {formData.correct_answer && (
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px' }}>
                                        <span style={{ fontWeight: '800', color: '#059669', fontSize: '0.8rem' }}>✓ ANSWER: </span>
                                        <span style={{ fontWeight: '700', color: '#065f46' }}>{formData.correct_answer}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {formData.section !== 'Reading' && (
                    <div className="form-group pb-4">
                        <div className="form-group-row">
                            {formData.section === 'Listening' && (
                                <div className="form-group">
                                    <label>Audio URL (MP3/Link)</label>
                                    <input
                                        type="text"
                                        name="audio_url"
                                        value={formData.audio_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/audio.mp3"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Image/Diagram URL (Optional)</label>
                                <input
                                    type="text"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/chart.png"
                                />
                            </div>
                        </div>

                        <label style={{ marginTop: '1rem', display: 'block' }}>
                            {formData.section === 'Listening' && 'Audio Transcript (Optional)'}
                            {formData.section === 'Writing' && 'Sample Answer (Optional)'}
                            {formData.section === 'Speaking' && 'Examiner Notes (Optional)'}
                        </label>
                        <textarea
                            name="passage"
                            value={formData.passage}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Enter additional context, transcript, or notes here..."
                        />
                    </div>
                )}

                {formData.question_type === 'MCQ' && (
                    <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--admin-border)' }}>
                        <label style={{ marginBottom: '0.5rem', display: 'block', color: 'var(--admin-primary)' }}>Multiple Choice Options</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {['A', 'B', 'C', 'D'].map((opt, idx) => (
                                <div key={opt} className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>Option {opt}</label>
                                    <input
                                        type="text"
                                        value={formData.options[idx] || ''}
                                        onChange={(e) => {
                                            const newOptions = [...formData.options];
                                            newOptions[idx] = e.target.value;
                                            setFormData(prev => ({ ...prev, options: newOptions }));
                                        }}
                                        placeholder={`Option ${opt} text...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-group-row">
                    <div className="form-group">
                        <label>Correct Answer</label>
                        <input
                            type="text"
                            name="correct_answer"
                            value={formData.correct_answer}
                            onChange={handleChange}
                            placeholder="Exact string matching"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Explanation (Rationale)</label>
                    <textarea
                        name="explanation"
                        value={formData.explanation}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Why is this the correct answer?"
                    />
                </div>

                <div className="admin-action-bar">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : (editingQuestionId ? 'Update Question' : 'Add Question to Bank')}
                    </button>
                </div>
            </form>
        </div>
    );

    // 2. Recycle Bin View
    const renderRecycleBin = () => (
        <div className="recycle-bin-container">
            <h3>Deleted Items</h3>
            {deletedItems.length === 0 ? <p>Bin is empty.</p> : (
                <div className="bin-list">
                    {deletedItems.map((item, i) => (
                        <div key={i} className="bin-item premium-glass" style={{ padding: '1rem', margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className={`badge ${item.type === 'passage' ? 'blue' : 'green'}`} style={{ marginRight: '10px' }}>{item.type}</span>
                                <span>{item.name}</span>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Deleted: {new Date(item.deleted_at).toLocaleDateString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-secondary" onClick={() => handleRestore(item.id, item.type)}>Restore</button>
                                <button className="btn-del-mini" style={{ color: 'red', border: '1px solid red', padding: '5px 10px', borderRadius: '5px' }} onClick={() => handleForceDelete(item.id, item.type)}>Delete Forever</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // 3. Question Dashboard List View
    const renderQuestionList = () => {
        const filtered = listFilter === 'All'
            ? questionList
            : questionList.filter(q => q.question_type === listFilter || q.category === listFilter);

        return (
            <div className="question-list-view">
                <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {formData.section} Question Bank
                            <span className="badge" style={{ background: '#3b82f6', fontSize: '0.9rem', padding: '4px 10px', borderRadius: '20px' }}>{questionList.length}</span>
                        </h2>
                        <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Manage and organize all your {formData.section} questions</p>
                    </div>
                    <button
                        className="add-new-btn"
                        onClick={() => {
                            setEditingQuestionId(null);
                            setCreationSection(formData.section); // Pre-select current section
                            setIsCreationDrawerOpen(true);
                            // Reset form data for new entry
                            setFormData(prev => ({ ...prev, text: '', correct_answer: '', explanation: '', options: ['', '', '', ''], instructions: '' }));
                        }}
                    >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Create New Question
                    </button>
                </div>

                {/* Creation Drawer Overlay */}
                {isCreationDrawerOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }} onClick={() => setIsCreationDrawerOpen(false)}>
                        <div className="premium-glass" style={{
                            width: '400px',
                            height: '100%',
                            background: '#0f172a',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'slideInRight 0.3s ease'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>Create Question</h2>
                                <button onClick={() => setIsCreationDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ color: '#94a3b8', marginBottom: '0.75rem', display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {activeView === 'questions' ? 'Skill Section' : 'Step 1: Select Skill'}
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    {(activeView === 'questions' ? [formData.section] : ['Reading', 'Listening', 'Writing', 'Speaking']).map(sec => (
                                        <button
                                            key={sec}
                                            onClick={() => setCreationSection(sec)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: creationSection === sec ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                                background: creationSection === sec ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                                color: creationSection === sec ? '#60a5fa' : '#cbd5e1',
                                                cursor: activeView === 'questions' ? 'default' : 'pointer',
                                                fontWeight: creationSection === sec ? '600' : '400',
                                                transition: 'all 0.2s',
                                                opacity: activeView === 'questions' ? 0.8 : 1,
                                                gridColumn: activeView === 'questions' ? '1 / -1' : 'auto'
                                            }}
                                            disabled={activeView === 'questions'}
                                        >
                                            {sec}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <label style={{ color: '#94a3b8', marginBottom: '0.75rem', display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 2: Select Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                    {QUESTION_TYPES_CONFIG[creationSection]?.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setIsCreationDrawerOpen(false);
                                                navigate(`/admin/builder?section=${creationSection}&type=${type.id}`);
                                            }}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.03)',
                                                color: '#e2e8f0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{type.label}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Create a new {type.id} task</div>
                                            </div>
                                            <span style={{ marginLeft: 'auto', color: '#64748b' }}>→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="list-controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <div className="filter-group">
                        <label style={{ marginRight: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Filter by Type:</label>
                        <select
                            value={listFilter}
                            onChange={(e) => setListFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="All">All Types</option>
                            <option value="MCQ">Multiple Choice</option>
                            <option value="T/F/NG">True/False/Not Given</option>
                            <option value="Matching">Matching</option>
                            <option value="GapFill">Gap Fill</option>
                        </select>
                    </div>
                </div>

                {fetchingList ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading questions...</div>
                ) : (
                    <div className="questions-table-container premium-glass" style={{
                        padding: '1rem',
                        maxHeight: 'calc(100vh - 300px)',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--admin-sidebar-bg)', zIndex: 10 }}>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>ID</th>
                                    <th style={{ padding: '12px' }}>Topic / Content</th>
                                    <th style={{ padding: '12px' }}>Type</th>
                                    <th style={{ padding: '12px' }}>Complexity</th>
                                    <th style={{ padding: '12px' }}>Created</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                            No questions found. Click "Add New Question" to start.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(q => (
                                        <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>#{q.id.substring(0, 6)}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: '600' }}>{q.content.topic || 'General'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {q.content.text.replace(/<[^>]*>/g, '')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                    {q.question_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>{q.difficulty}</td>
                                            <td style={{ padding: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                                {new Date(q.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleEditQuestion(q)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginRight: '8px' }}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleSoftDeleteQuestion(q.id)}
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
                )}
            </div>
        );
    };

    // MAIN CONTENT SWITCHER
    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardOverview />;
            case 'questions':
                return viewMode === 'list' ? renderQuestionList() : (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={() => {
                                    setViewMode('list');
                                    setEditingQuestionId(null);
                                }}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                ← Back to {formData.section} Bank
                            </button>
                        </div>
                        {renderQuestionBuilder()}
                    </div>
                );
            case 'passages':
                return <PassageManager />;
            case 'ai-generator':
                return <AIQuestionGenerator />;
            case 'exam-maker':
                return <ExamMaker />;
            case 'recycle-bin':
                return renderRecycleBin();
            case 'logout':
                return <div className="p-4">Logging out...</div>;
            default:
                return <DashboardOverview />;
        }
    };

    const getTitle = () => {
        const map = {
            'dashboard': 'Dashboard Overview',
            'questions': 'Question Bank Manager',
            'passages': 'Reading Passage Manager',
            'ai-generator': 'AI Content Generator',
            'exam-maker': 'Exam Paper Assembler',
            'recycle-bin': 'Recycle Bin',
            'settings': 'System Settings'
        };
        return map[activeView] || 'Admin Panel';
    };

    const handleNavigate = (view, params = {}) => {
        if (view === 'logout') {
            supabase.auth.signOut().then(() => navigate('/login'));
        } else {
            setActiveView(view);
            if (view === 'questions' && params.section) {
                setFormData(prev => ({
                    ...prev,
                    section: params.section,
                    // Reset category/topic defaults when switching section
                    category: getCategories(params.section)[0],
                    topic: getTopics(params.section, getCategories(params.section)[0])[0]
                }));
            }
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar activeView={activeView} onNavigate={handleNavigate} />

            <main className="admin-main">
                <AdminHeader title={getTitle()} user={user} currentTheme={currentTheme} onToggleTheme={onToggleTheme} />

                <div className="admin-content-body">
                    {message && (
                        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: message.includes('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }}>
                            {message}
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;

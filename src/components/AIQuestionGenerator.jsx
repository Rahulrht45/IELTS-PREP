import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import './AIQuestionGenerator.css';

const AIQuestionGenerator = () => {
    const [passages, setPassages] = useState([]);
    const [selectedPassageId, setSelectedPassageId] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [passageContent, setPassageContent] = useState('');
    const [isPassageEditing, setIsPassageEditing] = useState(false);
    const [previewMode, setPreviewMode] = useState('editor'); // 'editor' or 'exam'

    // Topic Hierarchy Definition (Same as AdminPanel)
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

    const [config, setConfig] = useState({
        mcqCount: 2,
        tfngCount: 2,
        gapFillCount: 2,
        difficulty: 'Medium',
        section: 'Reading',
        category: 'Multiple Choice',
        topic: 'Single Answer Questions'
    });

    const [message, setMessage] = useState('');

    useEffect(() => {
        loadPassages();
    }, []);

    useEffect(() => {
        if (selectedPassageId) {
            const p = passages.find(p => p.id === selectedPassageId);
            setPassageContent(p?.content || '');
        }
    }, [selectedPassageId, passages]);

    const loadPassages = async () => {
        try {
            const { data, error } = await supabase
                .from('passages')
                .select('id, title, content')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPassages(data || []);
        } catch (err) {
            console.error('Error loading passages:', err);
        }
    };

    const getCategories = (section) => Object.keys(TOPIC_STRUCTURE[section] || {});
    const getTopics = (section, category) => TOPIC_STRUCTURE[section]?.[category] || [];

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'section') {
                const firstCat = getCategories(value)[0];
                const firstTopic = getTopics(value, firstCat)[0] || '';
                newData.category = firstCat || '';
                newData.topic = firstTopic;
            } else if (name === 'category') {
                const firstTopic = getTopics(prev.section, value)[0] || '';
                newData.topic = firstTopic;
            }
            return newData;
        });
    };

    const insertTag = (tag) => {
        const textarea = document.querySelector('.passage-editor-textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = passageContent;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let newText;
        if (tag === 'p') newText = `${before}<p>${selected}</p>${after}`;
        else if (tag === 'b') newText = `${before}<b>${selected}</b>${after}`;
        else if (tag === 'h3') newText = `${before}<h3>${selected}</h3>${after}`;
        else if (tag === 'table') newText = `${before}<table class="passage-table"><tr><td>${selected}</td></tr></table>${after}`;
        else if (tag === 'lead') newText = `${before}<span class="exam-lead">${selected}</span>${after}`;
        else if (tag === 'header') newText = `${before}<span class="exam-passage-header">${selected}</span>${after}`;
        else if (tag === 'marker') newText = `${before}<span class="exam-marker">1</span>${after}`;
        else if (tag === 'highlight') newText = `${before}<span class="exam-highlight">${selected}</span>${after}`;
        else if (tag === 'letter') newText = `${before}<span class="exam-section-letter">${selected}</span>${after}`;
        else if (tag === 'center') newText = `${before}<div class="text-center">${selected}</div>${after}`;
        else if (tag === 'right') newText = `${before}<div class="text-right">${selected}</div>${after}`;
        else if (tag === 'justify') newText = `${before}<div class="text-justify">${selected}</div>${after}`;
        else if (tag === 'indent') newText = `${before}<div class="text-indent">${selected}</div>${after}`;

        setPassageContent(newText);
    };

    const updatePassageInDB = async () => {
        if (!selectedPassageId) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('passages')
                .update({ content: passageContent })
                .eq('id', selectedPassageId);

            if (error) throw error;
            setMessage('✅ Passage updated successfully!');
            loadPassages();
            setIsPassageEditing(false);
        } catch (err) {
            console.error('Error updating passage:', err);
            setMessage('❌ Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateQuestions = async () => {
        if (!selectedPassageId) {
            setMessage('❌ Please select a passage first.');
            return;
        }

        setGenerating(true);
        setMessage('');
        setGeneratedQuestions([]);

        const passage = passages.find(p => p.id === selectedPassageId);

        try {
            // SIMULATED AI CALL (Replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

            const mockQuestions = [];

            // Generate Mock MCQs
            for (let i = 0; i < config.mcqCount; i++) {
                mockQuestions.push({
                    type: 'MCQ',
                    text: `Generated MCQ Question ${i + 1} based on "${passage.title}"`,
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correct_answer: 'Option B',
                    explanation: 'AI generated explanation relying on paragraph 2.',
                    difficulty: config.difficulty
                });
            }

            // Generate Mock T/F/NG
            for (let i = 0; i < config.tfngCount; i++) {
                mockQuestions.push({
                    type: 'T/F/NG',
                    text: `Generated T/F/NG Statement ${i + 1} related to the text.`,
                    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
                    correct_answer: 'TRUE',
                    explanation: 'Directly supported by the text in paragraph 3.',
                    difficulty: config.difficulty
                });
            }

            // Generate Mock Gap Fills
            for (let i = 0; i < config.gapFillCount; i++) {
                mockQuestions.push({
                    type: 'GapFill',
                    text: `The main concept discussed in the passage is known as _______ (Fill in the blank).`,
                    correct_answer: 'Generated Answer',
                    explanation: 'Found in the concluding sentence.',
                    difficulty: config.difficulty,
                    word_limit: 2
                });
            }

            setGeneratedQuestions(mockQuestions);
            setMessage('✨ Questions generated successfully! Review them below.');

        } catch (err) {
            console.error('Error generating questions:', err);
            setMessage('❌ Error generating questions. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const saveQuestion = async (question, index) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const selectedPassage = passages.find(p => p.id === selectedPassageId);

            const content = {
                text: question.text,
                passage_id: selectedPassageId,
                passage: selectedPassage?.content || '',
                category: config.category,
                topic: config.topic
            };

            const { error } = await supabase
                .from('questions')
                .insert([{
                    section: config.section,
                    question_type: question.type,
                    content: content,
                    passage_id: selectedPassageId,
                    options: ['MCQ', 'Matching'].includes(question.type) ? question.options : null,
                    correct_answer: question.correct_answer,
                    explanation: question.explanation,
                    difficulty: question.difficulty,
                    word_limit: question.word_limit || null,
                    score: 1,
                    display_order: 0
                }]);

            if (error) throw error;

            const updatedList = [...generatedQuestions];
            updatedList[index].saved = true;
            setGeneratedQuestions(updatedList);

        } catch (err) {
            console.error('Error saving question:', err);
            alert('Failed to save question: ' + err.message);
        }
    };

    const updateGeneratedQuestion = (index, field, value) => {
        const updated = [...generatedQuestions];
        updated[index][field] = value;
        setGeneratedQuestions(updated);
    };

    const deleteGeneratedQuestion = (index) => {
        const updated = generatedQuestions.filter((_, i) => i !== index);
        setGeneratedQuestions(updated);
    };

    return (
        <div className="ai-generator-container">
            <div className="generator-header">
                <div className="header-top">
                    <div>
                        <h2>🤖 AI Question Generator</h2>
                        <p>Automatically create exam-style questions from your reading passages.</p>
                    </div>
                    {selectedPassageId && (
                        <button
                            className="live-preview-btn-main"
                            onClick={() => window.open(`/reading-test/${selectedPassageId}`, '_blank')}
                        >
                            👁️ Live Preview Exam
                        </button>
                    )}
                </div>
            </div>

            <div className="generator-grid">
                {/* Left Side: Configuration & Passage */}
                <div className="gen-left-col">
                    <div className="config-panel premium-glass">
                        <div className="form-group">
                            <label>Passage Selection</label>
                            <select
                                value={selectedPassageId}
                                onChange={(e) => setSelectedPassageId(e.target.value)}
                                className="passage-select-large"
                            >
                                <option value="">-- Choose a Passage --</option>
                                {passages.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        {selectedPassageId && (
                            <div className="passage-editor-section">
                                <div className="section-head">
                                    <label>Passage Content (HTML Supported) *</label>
                                    <button
                                        className="edit-toggle-btn"
                                        onClick={() => setIsPassageEditing(!isPassageEditing)}
                                    >
                                        {isPassageEditing ? '✅ Done' : '✏️ Edit Passage'}
                                    </button>
                                </div>

                                {isPassageEditing ? (
                                    <div className="passage-edit-controls">
                                        <div className="rich-toolbar-gen">
                                            <button onClick={() => insertTag('p')}>P</button>
                                            <button onClick={() => insertTag('lead')}>Lead</button>
                                            <button onClick={() => insertTag('header')}>Head</button>
                                            <button onClick={() => insertTag('letter')}>A</button>
                                            <button onClick={() => insertTag('marker')}>[1]</button>
                                            <button onClick={() => insertTag('center')}>Center</button>
                                            <button onClick={() => insertTag('right')}>Right</button>
                                            <button onClick={() => insertTag('highlight')}>High</button>
                                            <button onClick={() => insertTag('table')}>Table</button>
                                        </div>
                                        <textarea
                                            className="passage-editor-textarea"
                                            value={passageContent}
                                            onChange={(e) => setPassageContent(e.target.value)}
                                            rows={12}
                                        />
                                        <button className="btn-update-passage" onClick={updatePassageInDB} disabled={loading}>
                                            {loading ? 'Updating...' : '💾 Save Content Changes'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="passage-live-preview-mini">
                                        <div
                                            className="mini-preview-content"
                                            dangerouslySetInnerHTML={{ __html: passageContent }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="settings-grid">
                            <div className="form-group">
                                <label>Section</label>
                                <select name="section" value={config.section} onChange={handleConfigChange}>
                                    <option value="Reading">Reading</option>
                                    <option value="Listening">Listening</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Speaking">Speaking</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Difficulty</label>
                                <select name="difficulty" value={config.difficulty} onChange={handleConfigChange}>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="counts-row">
                            <div className="form-group">
                                <label>MCQ</label>
                                <input type="number" name="mcqCount" min="0" max="10" value={config.mcqCount} onChange={handleConfigChange} />
                            </div>
                            <div className="form-group">
                                <label>T/F/NG</label>
                                <input type="number" name="tfngCount" min="0" max="10" value={config.tfngCount} onChange={handleConfigChange} />
                            </div>
                            <div className="form-group">
                                <label>Gap Fill</label>
                                <input type="number" name="gapFillCount" min="0" max="10" value={config.gapFillCount} onChange={handleConfigChange} />
                            </div>
                        </div>

                        <div className="action-row">
                            <button
                                className="generate-btn"
                                onClick={generateQuestions}
                                disabled={generating || !selectedPassageId}
                            >
                                {generating ? <span className="spinner"></span> : '✨ Generate Questions'}
                            </button>
                            {message && <span className={`status-msg ${message.includes('Error') ? 'error' : 'success'}`}>{message}</span>}
                        </div>
                    </div>
                </div>

                {/* Right Side: Generated Results & Live Questions Seen */}
                <div className="gen-right-col">
                    {generatedQuestions.length > 0 ? (
                        <div className="results-area custom-scrollbar">
                            <div className="results-header">
                                <div className="view-selector">
                                    <button
                                        className={previewMode === 'editor' ? 'active' : ''}
                                        onClick={() => setPreviewMode('editor')}
                                    >
                                        📝 Questions Editor
                                    </button>
                                    <button
                                        className={previewMode === 'exam' ? 'active' : ''}
                                        onClick={() => setPreviewMode('exam')}
                                    >
                                        👁️ Exam Preview
                                    </button>
                                </div>
                                <div className="seen-badge">Live Questions Seen</div>
                            </div>

                            {previewMode === 'editor' ? (
                                <div className="questions-list">
                                    {generatedQuestions.map((q, idx) => (
                                        <div key={idx} className={`question-preview-card ${q.saved ? 'saved' : ''}`}>
                                            <div className="q-header">
                                                <span className="q-type">{q.type}</span>
                                                {!q.saved && <button className="delete-q-btn" onClick={() => deleteGeneratedQuestion(idx)}>🗑️</button>}
                                                {q.saved && <span className="saved-badge">✅ Approved</span>}
                                            </div>
                                            <div className="q-body">
                                                <textarea
                                                    className="editable-q-text"
                                                    value={q.text}
                                                    onChange={(e) => updateGeneratedQuestion(idx, 'text', e.target.value)}
                                                    disabled={q.saved}
                                                />
                                                {q.options && (
                                                    <div className="editable-options">
                                                        {q.options.map((opt, i) => (
                                                            <input
                                                                key={i}
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...q.options];
                                                                    newOpts[i] = e.target.value;
                                                                    updateGeneratedQuestion(idx, 'options', newOpts);
                                                                }}
                                                                disabled={q.saved}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="editable-row">
                                                    <span>Word Limit:</span>
                                                    <input
                                                        type="number"
                                                        value={q.word_limit || ''}
                                                        onChange={(e) => updateGeneratedQuestion(idx, 'word_limit', e.target.value)}
                                                        disabled={q.saved}
                                                    />
                                                </div>
                                                <div className="editable-row">
                                                    <span>Correct Answer:</span>
                                                    <input
                                                        type="text"
                                                        value={q.correct_answer}
                                                        onChange={(e) => updateGeneratedQuestion(idx, 'correct_answer', e.target.value)}
                                                        disabled={q.saved}
                                                    />
                                                </div>
                                            </div>
                                            <div className="q-actions">
                                                {!q.saved && (
                                                    <button className="btn-approve" onClick={() => saveQuestion(q, idx)}>
                                                        Approve & Save
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="exam-simulation-preview scrollable-content">
                                    <div className="preview-questions-only">
                                        <h4>QUESTIONS PREVIEW</h4>
                                        {generatedQuestions.map((q, idx) => (
                                            <div key={idx} className="simulated-q-card">
                                                <div className="sm-q-num">{idx + 1}</div>
                                                <div className="sm-q-content">
                                                    <p><strong>{q.type}:</strong> {q.text}</p>
                                                    {q.options && (
                                                        <ul className="sm-options">
                                                            {q.options.map((opt, i) => <li key={i}>{String.fromCharCode(65 + i)}. {opt}</li>)}
                                                        </ul>
                                                    )}
                                                    <div className="sm-answer-key">Key: {q.correct_answer}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-results-fallback premium-glass">
                            <div className="fallback-icon">🎯</div>
                            <h4>No questions generated yet</h4>
                            <p>Configure the counts and click generate to see the magic happen.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIQuestionGenerator;

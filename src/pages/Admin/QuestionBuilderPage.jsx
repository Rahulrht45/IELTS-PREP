import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import SmartText from '../../components/SmartText';
import './AdminPanel.css';
import './AdminPanelToolbar.css';
import './AdminPanelToolbar.css';

const QuestionBuilderPage = ({ currentTheme, onToggleTheme }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initial State based on URL params
    const initialSection = searchParams.get('section') || 'Reading';
    const initialType = searchParams.get('type') || 'MCQ';
    const questionId = searchParams.get('id'); // Get ID for editing

    // Split View State
    const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
    const [isDragging, setIsDragging] = useState(false);

    // User State
    const [user, setUser] = useState(null);

    // Form State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedPassageId, setSelectedPassageId] = useState('');
    const [passages, setPassages] = useState([]);
    const [linkedQuestions, setLinkedQuestions] = useState([]);

    // Topic Hierarchy (reused)
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

    const getCategories = (section) => Object.keys(TOPIC_STRUCTURE[section] || {});
    const getTopics = (section, category) => TOPIC_STRUCTURE[section]?.[category] || [];

    const initialCategories = getCategories(initialSection);
    const initialCategory = initialCategories.length > 0 ? initialCategories[0] : '';
    const initialTopics = getTopics(initialSection, initialCategory);
    const initialTopic = initialTopics.length > 0 ? initialTopics[0] : '';

    const [formData, setFormData] = useState({
        section: initialSection,
        category: initialCategory,
        topic: initialTopic,
        question_type: initialType,
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
        score: 1,
        template_mode: false,
        template_content: ''
    });

    // --- Undo/Redo Logic ---
    const [history, setHistory] = useState({ undoStack: [], redoStack: [] });



    const saveToHistory = () => {
        const stateToSave = JSON.stringify({ text: formData.text, passage: formData.passage });
        setHistory(prev => {
            // Avoid pushing identical state
            if (prev.undoStack.length > 0 && prev.undoStack[prev.undoStack.length - 1] === stateToSave) {
                return prev;
            }
            return {
                undoStack: [...prev.undoStack, stateToSave].slice(-50),
                redoStack: []
            };
        });
    };

    const handleUndo = () => {
        if (history.undoStack.length === 0) return;
        const lastState = JSON.parse(history.undoStack[history.undoStack.length - 1]);
        const currentState = JSON.stringify({ text: formData.text, passage: formData.passage });

        setHistory(prev => ({
            undoStack: prev.undoStack.slice(0, -1),
            redoStack: [currentState, ...prev.redoStack].slice(0, 50)
        }));
        setFormData(prev => ({ ...prev, ...lastState }));
    };

    const handleRedo = () => {
        if (history.redoStack.length === 0) return;
        const nextState = JSON.parse(history.redoStack[0]);
        const currentState = JSON.stringify({ text: formData.text, passage: formData.passage });

        setHistory(prev => ({
            undoStack: [...prev.undoStack, currentState].slice(-50),
            redoStack: prev.redoStack.slice(1)
        }));
        setFormData(prev => ({ ...prev, ...nextState }));
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
    }, [history, formData.text, formData.passage]);

    // --- Effects ---
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || { id: 'dev-user', email: 'dev@example.com' });
        };

        const loadPassages = async () => {
            const { data } = await supabase.from('passages').select('id, title').is('deleted_at', null).order('created_at', { ascending: false });
            setPassages(data || []);
        };

        checkUser();
        loadPassages();
    }, [navigate]);

    useEffect(() => {
        const loadLinkedQuestions = async () => {
            const { data } = await supabase.from('questions').select('*').eq('passage_id', selectedPassageId).is('deleted_at', null).order('display_order', { ascending: true });
            setLinkedQuestions(data || []);
        };

        if (selectedPassageId) loadLinkedQuestions();
    }, [selectedPassageId]);

    // Load existing question for editing
    useEffect(() => {
        if (!questionId) return;

        const loadQuestion = async () => {
            setLoading(true);
            try {
                const { data: q, error } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('id', questionId)
                    .single();

                if (error) throw error;
                if (q) {
                    setFormData({
                        section: q.section,
                        question_type: q.question_type,
                        difficulty: q.difficulty || 'Medium',
                        score: q.score || 1,
                        correct_answer: q.correct_answer || '',
                        explanation: q.explanation || '',
                        options: q.options || ['', '', '', ''],
                        text: q.content?.text || '',
                        instructions: q.content?.instructions || '',
                        category: q.content?.category || getCategories(q.section)[0],
                        topic: q.content?.topic || '',
                        passage: q.content?.passage || '',
                        audio_url: q.content?.audio_url || '',
                        image_url: q.content?.image_url || '',
                        template_mode: false,
                        template_content: ''
                    });
                    setSelectedPassageId(q.passage_id || '');
                }
            } catch (err) {
                console.error("Error loading question:", err);
                setMessage('Error loading question data.');
            } finally {
                setLoading(false);
            }
        };

        loadQuestion();
    }, [questionId, user]); // Depend on questionId and user (to ensure auth is ready)


    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Track changes for history on significant edits
        // Lower threshold to ensure "any text" is captured reasonably well (e.g. short words)
        // Also capture purely structural changes like newlines
        const diff = Math.abs(value.length - formData[name].length);
        const isDeletion = value.length < formData[name].length;
        // Save on larger edits, word endings (space), newlines, OR any deletion
        if ((name === 'text' || name === 'passage') && (diff > 5 || value.endsWith(' ') || value.includes('\n') !== formData[name].includes('\n') || isDeletion)) {
            saveToHistory();
        }

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

        let newText = before + selected + after;

        if (tag === 'p') newText = `${before}<p>${selected || 'text'}</p>${after}`;
        else if (tag === 'b') newText = `${before}<strong>${selected}</strong>${after}`;
        else if (tag === 'i') newText = `${before}<em>${selected}</em>${after}`;
        else if (tag === 'u') newText = `${before}<u>${selected}</u>${after}`;
        else if (tag === 'grid_row') {
            newText = `${before}
<div style="display: grid; grid-template-columns: 120px 1fr; gap: 1rem; align-items: baseline; margin-bottom: 0.5rem;">
  <div><strong>${selected || 'TERM'}</strong></div>
  <div>Definition or description goes here...</div>
</div>
${after}`;
        }
        else if (tag === 'box') {
            newText = `${before}
<div class="academic-box">
  <h4 class="academic-header">Questions 1-5</h4>
  <p class="academic-instr">Complete the table below. Write <strong>NO MORE THAN TWO WORDS</strong> for each answer.</p>
</div>
${after}`;
        }
        else if (tag === 'wrapbox') {
            newText = `${before}
<div class="academic-box" style="border-width: 2px;">
  ${selected || '<p class="passage-p">[ Enter Question Content Here ]</p>'}
</div>
${after}`;
        }
        else if (tag === 'instruction') {
            newText = `${before}<p class="academic-instr">${selected || 'Choose the correct letter, A, B, C or D.'}</p>${after}`;
        }
        else if (tag === 'list') {
            newText = `${before}
<ul style="padding-left:1.5rem; margin:1rem 0;">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>${after}`;
        }
        else if (tag === 'table') {
            newText = `${before}
<table class="academic-table">
  <tr>
    <th>Category</th>
    <th>Details</th>
  </tr>
  <tr>
    <td>Item 1</td>
    <td>Description here</td>
  </tr>
</table>
${after}`;
        }
        else if (tag === 'matching') {
            newText = `${before}
<div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin:1rem 0;">
  <div class="academic-box" style="margin:0; padding:1rem;">
    <strong class="academic-header">List A</strong>
    <p class="passage-p">1. Item One</p>
    <p class="passage-p">2. Item Two</p>
  </div>
  <div class="academic-box" style="margin:0; padding:1rem;">
    <strong class="academic-header">List B</strong>
    <p class="passage-p">A. Description A</p>
    <p class="passage-p">B. Description B</p>
  </div>
</div>
${after}`;
        }
        else if (tag === 'flowchart') {
            newText = `${before}
<div style="display:flex; align-items:center; gap:0.5rem; margin:1rem 0; flex-wrap:wrap;">
  <div class="academic-box" style="margin:0; padding:0.5rem 1rem; border-radius:4px;">Step 1</div>
  <span style="color:var(--text-muted);">→</span>
  <div class="academic-box" style="margin:0; padding:0.5rem 1rem; border-radius:4px;">Step 2</div>
  <span style="color:var(--text-muted);">→</span>
  <div class="academic-box" style="margin:0; padding:0.5rem 1rem; border-radius:4px;">Step 3</div>
</div>
${after}`;
        }
        else if (tag === 'diagram') {
            newText = `${before}
<div class="academic-box" style="text-align:center; padding:2.5rem; border-style:dashed;">
  <p class="academic-instr">[ Diagram / Image Placeholder ]</p>
  <div style="margin-top:1.5rem; text-align:left; display:inline-block;">
    <p class="passage-p"><strong>Label 1:</strong> <span style="border-bottom:1px solid var(--border-main); width:120px; display:inline-block; margin-left:8px;"></span></p>
    <p class="passage-p"><strong>Label 2:</strong> <span style="border-bottom:1px solid var(--border-main); width:120px; display:inline-block; margin-left:8px;"></span></p>
  </div>
</div>
${after}`;
        }
        else if (tag === 'gap') {
            // Auto-increment gap numbers
            const gapMatches = text.match(/____(\d+)____/g) || [];
            const lastGapNum = gapMatches.length > 0
                ? Math.max(...gapMatches.map(g => parseInt(g.match(/\d+/)[0])))
                : 0;
            const nextNum = lastGapNum + 1;
            newText = `${before}____${nextNum}____${after}`;
        }
        else if (tag === 'simplebox') {
            newText = `${before}
<div class="academic-box">
  <p class="passage-p" style="margin:0;">Your content goes here...</p>
</div>
${after}`;
        }
        else if (tag === 'note_completion') {
            const gapMatches = text.match(/____(\d+)____/g) || [];
            let lastGapNum = gapMatches.length > 0
                ? Math.max(...gapMatches.map(g => parseInt(g.match(/\d+/)[0])))
                : 0;

            newText = `${before}
<div class="academic-box">
  <h3 class="text-center" style="margin-bottom: 1rem;">Manatees</h3>

  <div style="margin-bottom: 1rem;">
    <strong style="font-size: 1.1em;">Appearance</strong>
    <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
      <li style="margin-bottom: 8px;">look similar to dugongs, but with a differently shaped <span class="exam-marker">${++lastGapNum}</span> ____${lastGapNum}____</li>
    </ul>
  </div>

  <div style="margin-bottom: 1rem;">
    <strong style="font-size: 1.1em;">Movement</strong>
    <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
      <li style="margin-bottom: 8px;">have fewer neck bones than most mammals</li>
      <li style="margin-bottom: 8px;">need to use their <span class="exam-marker">${++lastGapNum}</span> ____${lastGapNum}____ to help to turn their bodies around in order to look sideways</li>
      <li style="margin-bottom: 8px;">sense vibrations in the water by means of <span class="exam-marker">${++lastGapNum}</span> ____${lastGapNum}____ on their skin</li>
    </ul>
  </div>
</div>
${after}`;
        }
        else if (tag === 'infobox') {
            newText = `${before}
<div class="academic-box" style="border-left:4px solid var(--admin-primary); background:rgba(59, 130, 246, 0.05);">
  <p class="academic-header" style="color:var(--admin-primary); display:flex; align-items:center; gap:8px;">
    💡 Important Information
  </p>
  <p class="passage-p" style="margin:0;">Add your important note or tip here...</p>
</div>
${after}`;
        }
        else if (tag === 'questionbox') {
            newText = `${before}
<div class="academic-box">
  <h4 class="academic-header">Question 1</h4>
  <p class="passage-p" style="margin-bottom:1rem;">Your question text here...</p>
  
  <div style="padding-left:1rem; margin-top:1rem;">
    <p class="passage-p" style="margin:0.5rem 0;"><strong>A)</strong> Option 1</p>
    <p class="passage-p" style="margin:0.5rem 0;"><strong>B)</strong> Option 2</p>
    <p class="passage-p" style="margin:0.5rem 0;"><strong>C)</strong> Option 3</p>
    <p class="passage-p" style="margin:0.5rem 0;"><strong>D)</strong> Option 4</p>
  </div>
</div>
${after}`;
        }
        else if (tag === 'highlight') {
            newText = `${before} <span class="academic-highlight">${selected || 'highlighted text'}</span> ${after}`;
        }
        else if (tag === 'tfng_instruction') {
            newText = `${before}
<div class="academic-box">
  <h4 class="academic-header">Questions X-Y</h4>
  <p class="academic-instr">Do the following statements agree with the information given in Reading Passage 1?</p>
  <p class="academic-instr">In boxes X-Y on your answer sheet, choose</p>
  <div style="margin-left: 1.5rem; margin-top: 0.8rem;">
    <div style="display: grid; grid-template-columns: 120px 1fr; gap: 4px; align-items: baseline;">
        <strong style="color: var(--admin-text);">TRUE</strong>
        <span class="passage-p" style="margin:0;">if the statement agrees with the information</span>
        
        <strong style="color: var(--admin-text);">FALSE</strong>
        <span class="passage-p" style="margin:0;">if the statement contradicts the information</span>
        
        <strong style="color: var(--admin-text);">NOT GIVEN</strong>
        <span class="passage-p" style="margin:0;">if there is no information on this</span>
    </div>
  </div>
</div>
${after}`;
        }
        else if (tag === 'q_row') {
            newText = `${before}
<div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 0.5rem;">
  <strong style="white-space: nowrap; font-size: 1.1em;">${selected || '7'}</strong>
  <span style="font-size: 1.1em;">${selected ? '' : 'West Indian manatees can be found in a variety of different aquatic habitats.'}</span>
</div>
${after}`;
        }
        else if (tag === 'tfng_options') { // Default Horizontal
            newText = `${before}
<div style="display: flex; gap: 2rem; margin-left: 2rem; margin-bottom: 1.5rem; color: var(--admin-text);">
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>TRUE</strong></div>
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>FALSE</strong></div>
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>NOT GIVEN</strong></div>
</div>
${after}`;
        }
        else if (tag === 'tfng_vertical') { // new Vertical
            newText = `${before}
<div style="display: flex; flexDirection: column; gap: 0.8rem; margin-left: 2rem; margin-bottom: 1.5rem; color: var(--admin-text);">
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>TRUE</strong></div>
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>FALSE</strong></div>
  <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--admin-text-muted);"></div> <strong>NOT GIVEN</strong></div>
</div>
${after}`;
        }




        if (newText !== formData.text) {
            saveToHistory();
            setFormData(prev => ({ ...prev, text: newText }));
        }
    };

    const insertTextStyle = (styleType, value) => {
        const textarea = document.querySelector('textarea[name="text"]');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.text;
        const selected = text.substring(start, end);

        if (!selected) {
            alert('Please select some text first to apply this style.');
            return;
        }

        saveToHistory();
        const before = text.substring(0, start);
        const after = text.substring(end);

        let newText = text;
        if (styleType === 'color') {
            newText = `${before}<span style="color: ${value}">${selected}</span>${after}`;
        } else if (styleType === 'size') {
            newText = `${before}<span style="font-size: ${value}">${selected}</span>${after}`;
        }

        setFormData(prev => ({ ...prev, text: newText }));
    };





    // --- Resizer Handlers ---
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Calculate percentage based on viewport width (or container)
        // Since container is full width, we can use window.innerWidth for rough calc, 
        // or getting the container ref is better properly, but window logic is simpler for full page
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
            document.body.style.userSelect = 'auto';
            document.body.style.cursor = 'default';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(''); // Clear previous messages

        try {
            if (!user) throw new Error('You must be logged in to save questions.');
            if (!formData.text.trim()) throw new Error('Question text cannot be empty.');

            console.log('Submitting Question Data:', formData);

            const content = {
                text: formData.text,
                instructions: formData.instructions,
                passage: formData.passage,
                category: formData.category,
                topic: formData.topic,
                audio_url: formData.audio_url || null,
                image_url: formData.image_url || null
            };

            const payload = {
                section: formData.section,
                question_type: formData.question_type,
                content: content,
                passage_id: selectedPassageId || null,
                options: formData.question_type === 'MCQ' ? formData.options : null,
                correct_answer: formData.correct_answer,
                explanation: formData.explanation,
                difficulty: formData.difficulty,
                display_order: linkedQuestions ? linkedQuestions.length : 0,
                user_id: user.id,
                score: formData.score || 1
            };

            console.log('Payload to Supabase:', payload);

            let result;
            if (questionId) {
                // Update existing question
                const { data, error } = await supabase
                    .from('questions')
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', questionId)
                    .select();
                result = { data, error };
            } else {
                // Insert new question
                const { data, error } = await supabase.from('questions').insert([payload]).select();
                result = { data, error };
            }

            if (result.error) {
                console.error('Supabase Error:', result.error);
                throw new Error(result.error.message || 'Database operation failed');
            }

            console.log('Operation Success:', result.data);
            setMessage(questionId ? '✅ Question updated successfully!' : '✅ Question added successfully!');
            setTimeout(() => {
                navigate('/admin');
            }, 1000);
        } catch (err) {
            console.error('Submission Error:', err);
            setMessage('Error: ' + (err.message || 'Unknown error occurred'));
            alert('Failed to save question: ' + (err.message || 'Check console for details'));
        } finally {
            setLoading(false);
        }
    };

    // Helper Component for Live Preview
    const LivePreviewInput = ({ type, options }) => {
        if (type === 'MCQ') {
            return (
                <div className="options-list">
                    {options.map((opt, idx) => (
                        <div key={idx} className="option-item">
                            <div className="radio-circle"></div>
                            {/* Render Option Content using SmartText for interactive preview */}
                            <SmartText
                                text={opt || `Option ${String.fromCharCode(65 + idx)} `}
                                onLookup={(word, e) => {
                                    e.stopPropagation();
                                    alert(`Vocab Lookup: ${word} (Disabled in builder preview)`);
                                }}
                            />
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
                    style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '1rem' }}
                />
            );
        }
        if (type === 'Blank') {
            return (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '2rem' }}>
                    (No Answer Input Required)
                </div>
            );
        }
        return <input type="text" className="text-input-preview" disabled placeholder="[Student Answer Input]" />;
    };

    return (
        <div className="admin-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-header premium-glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                        ←
                    </button>
                    <h2 style={{ margin: 0, color: 'var(--admin-text)', fontSize: '1.1rem' }}>
                        {questionId ? 'Edit Question' : `${formData.section} Question Builder`}
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {selectedPassageId && (
                        <div className="linked-status" style={{ fontSize: '0.85rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                            🔗 {linkedQuestions.length} Questions Linked
                        </div>
                    )}
                    {message && <div style={{ color: message.startsWith('Error') ? '#f87171' : '#4ade80', fontSize: '0.9rem' }}>{message}</div>}

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
                    <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        {loading ? 'Saving...' : (questionId ? 'Update Question' : 'Save Question')}
                    </button>
                </div>
            </div>

            <div className="builder-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem' }}>

                {/* Top Controls Row */}
                <div className="controls-row premium-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>

                    {/* Standard Metadata */}
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '130px' }}>
                        <label>Section</label>
                        <select
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            style={{ width: '100%', opacity: searchParams.get('section') ? 0.7 : 1 }}
                            disabled={!!searchParams.get('section')}
                        >
                            {searchParams.get('section') ? (
                                // Show only the selected section when coming from question bank
                                <option value={formData.section}>{formData.section}</option>
                            ) : (
                                // Show all sections when creating manually
                                <>
                                    <option value="Reading">Reading</option>
                                    <option value="Listening">Listening</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Speaking">Speaking</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '130px' }}>
                        <label>Type</label>
                        <select
                            name="question_type"
                            value={formData.question_type}
                            onChange={handleChange}
                            style={{ width: '100%', opacity: searchParams.get('type') ? 0.7 : 1 }}
                            disabled={!!searchParams.get('type')}
                        >
                            {searchParams.get('type') ? (
                                // Show only the selected type when coming from question bank
                                <option value={formData.question_type}>
                                    {formData.question_type === 'MCQ' && 'Multiple Choice'}
                                    {formData.question_type === 'T/F/NG' && 'True/False/Not Given'}
                                    {formData.question_type === 'Y/N/NG' && 'Yes/No/Not Given'}
                                    {formData.question_type === 'GapFill' && 'Gap Fill'}
                                    {formData.question_type === 'Matching' && 'Matching'}
                                    {formData.question_type === 'ShortAnswer' && 'Short Answer'}
                                    {formData.question_type === 'Essay' && 'Essay (Writing)'}
                                    {formData.question_type === 'Letter' && 'Letter (Writing)'}
                                    {formData.question_type === 'Part1' && 'Speaking Part 1'}
                                    {formData.question_type === 'Part2' && 'Speaking Part 2'}
                                    {formData.question_type === 'Part3' && 'Speaking Part 3'}
                                    {formData.question_type === 'Blank' && 'Blank Page'}
                                </option>
                            ) : (
                                // Show all types when creating manually
                                <>
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="T/F/NG">True/False/Not Given</option>
                                    <option value="Y/N/NG">Yes/No/Not Given</option>
                                    <option value="GapFill">Gap Fill</option>
                                    <option value="Matching">Matching</option>
                                    <option value="ShortAnswer">Short Answer</option>
                                    <option value="Essay">Essay (Writing)</option>
                                    <option value="Letter">Letter (Writing)</option>
                                    <option value="Part1">Speaking Part 1</option>
                                    <option value="Part2">Speaking Part 2</option>
                                    <option value="Part3">Speaking Part 3</option>
                                    <option value="Blank">Blank Page</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Quick HTML Helper */}
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label style={{ color: '#a5b4fc' }}>⚡ Insert HTML</label>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    insertQuestionTag(e.target.value);
                                    e.target.value = ""; // Reset
                                }
                            }}
                            style={{ width: '100%', borderColor: '#6366f1' }}
                        >
                            <option value="">-- Choose Template --</option>
                            <option value="box">Summary Box</option>
                            <option value="simplebox">📦 Simple Box</option>
                            <option value="infobox">💡 Info Box</option>
                            <option value="questionbox">❓ Question Box (MCQ)</option>
                            <option value="wrapbox">🎁 Question Box (Wrap Selection)</option>
                            <option value="instruction">Instruction Text</option>
                            <option value="table">Simple Table</option>
                            <option value="list">Bullet List</option>
                            <option value="matching">Matching Columns</option>
                            <option value="flowchart">Flowchart</option>
                            <option value="diagram">Diagram Labels</option>
                            <option value="highlight">Highlight Text</option>
                            <option value="gap">📊 Gap Fill (____1____)</option>
                            <option value="tfng_instruction">✅ T/F/NG Instructions</option>
                        </select>
                    </div>

                    {/* Moved Passage Selector Here */}
                    <div className="form-group" style={{ marginBottom: 0, flex: 1.5, minWidth: '200px' }}>
                        <label style={{ color: '#60a5fa' }}>🔗 Link to Passage (Optional)</label>
                        <select
                            value={selectedPassageId}
                            onChange={(e) => setSelectedPassageId(e.target.value)}
                            style={{ width: '100%', borderColor: selectedPassageId ? '#3b82f6' : '' }}
                        >
                            <option value="">-- No Passage (Standalone) --</option>
                            {passages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>

                {/* Rich Formatting Toolbar */}
                <div className="premium-glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>
                                🎨 Rich Formatting Tools
                            </label>
                        </div>
                        <div className="form-group" style={{ margin: 0, width: '150px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>Correct Answer</label>
                            <input
                                type="text"
                                name="correct_answer"
                                value={formData.correct_answer}
                                onChange={handleChange}
                                placeholder="e.g. A"
                                style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', color: '#4ade80', padding: '0.5rem', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    {/* Structure & Layout */}
                    <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--admin-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            📐 Structure & Layout
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => insertQuestionTag('p')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                📄 Paragraph
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('note_completion')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                📝 Note Completion
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('instruction')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                🎯 Lead Text
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('box')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                📋 Section Header
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('table')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                📊 Table
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('wrapbox')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                🎁 Question Box
                            </button>
                        </div>
                    </div>

                    {/* Formatting & Style */}
                    <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--admin-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            🎨 Formatting & Style
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Basic Formatting */}
                            <button type="button" onClick={() => insertQuestionTag('b')} style={{ padding: '0.5rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', minWidth: '32px' }} title="Bold">
                                B
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('i')} style={{ padding: '0.5rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '6px', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'serif', cursor: 'pointer', minWidth: '32px' }} title="Italic">
                                I
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('u')} style={{ padding: '0.5rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '6px', fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer', minWidth: '32px' }} title="Underline">
                                U
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('grid_row')} style={{ padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ◫ 2-Col
                            </button>

                            <div style={{ width: '1px', height: '24px', background: 'var(--admin-border)', margin: '0 4px' }}></div>

                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const after = text.substring(start);
                                const newText = `${before}<span class="paragraph-letter">A</span>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                🔤 Letter (A)
                            </button>
                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const after = text.substring(start);
                                const newText = `${before}<span class="exam-marker">1</span>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                🔢 Marker [1]
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('q_row')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                🔢 Q-Row
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('tfng_options')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ↔ Options
                            </button>
                            <button type="button" onClick={() => insertQuestionTag('tfng_vertical')} style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ↕ Options
                            </button>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--admin-border)', height: '34px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Color:</span>
                        <input
                            type="color"
                            onChange={(e) => insertTextStyle('color', e.target.value)}
                            title="Select text then pick a color"
                            style={{ width: '30px', height: '20px', padding: 0, border: '1px solid var(--admin-text-muted)', borderRadius: '4px', cursor: 'pointer', background: 'var(--admin-card-bg)' }}
                        />
                    </div>

                    {/* Size Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--admin-border)', height: '34px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Size:</span>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    insertTextStyle('size', e.target.value);
                                    e.target.value = ''; // reset
                                }
                            }}
                            title="Select text then pick a size"
                            style={{ border: 'none', background: 'transparent', color: 'var(--admin-text)', fontSize: '0.85rem', width: '70px', outline: 'none', padding: 0 }}
                        >
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="">--</option>
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="0.8em">Small</option>
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="1em">Normal</option>
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="1.2em">Large</option>
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="1.5em">X-Large</option>
                            <option style={{ backgroundColor: 'var(--admin-sidebar-bg)', color: 'var(--admin-text)' }} value="2em">Huge</option>
                        </select>
                    </div>


                    {/* Text Alignment */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ↔️ Text Alignment
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const selected = text.substring(start, end);
                                const after = text.substring(end);
                                const newText = `${before}<div class="text-center">${selected}</div>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ⬌ Center
                            </button>
                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const selected = text.substring(start, end);
                                const after = text.substring(end);
                                const newText = `${before}<div class="text-right">${selected}</div>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ➡️ Right
                            </button>
                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const selected = text.substring(start, end);
                                const after = text.substring(end);
                                const newText = `${before}<div class="text-justify">${selected}</div>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ↔️ Justify
                            </button>
                            <button type="button" onClick={() => {
                                const textarea = document.querySelector('textarea[name="text"]');
                                if (!textarea) return;
                                saveToHistory();
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = formData.text;
                                const before = text.substring(0, start);
                                const selected = text.substring(start, end);
                                const after = text.substring(end);
                                const newText = `${before}<div class="text-indent">${selected}</div>${after}`;
                                setFormData(prev => ({ ...prev, text: newText }));
                            }} style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                ⇥ Indent
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Split View: Editor & Preview */}
                <div className="split-workspace" style={{ display: 'flex', height: 'calc(100vh - 140px)', overflow: 'hidden', gap: '0' }}>

                    {/* Left: Editor Pane */}
                    <div className="left-pane-container" style={{ width: `${leftPaneWidth}%`, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '1rem' }}>

                        {/* IELTS Template Mode Toggle */}
                        <div className="premium-glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    🎯 IELTS Template Mode
                                </label>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                                    Unified format for all IELTS questions using {`{{1}}`}, {`{{2}}`} placeholders
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, template_mode: !prev.template_mode }))}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    background: formData.template_mode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(100, 116, 139, 0.2)',
                                    color: formData.template_mode ? '#fff' : 'var(--admin-text-muted)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {formData.template_mode ? '✅ Enabled' : 'Enable'}
                            </button>
                        </div>

                        {/* IELTS Template Editor (shows when template mode is ON) */}
                        {formData.template_mode && (
                            <div className="editor-pane premium-glass" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="pane-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--admin-border)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: '#10b981', fontSize: '0.95rem' }}>📋 IELTS Template Content</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const example = `[QUESTION_TYPE]: NOTE_COMPLETION

[INSTRUCTIONS]:
Complete the notes below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.

[CONTENT]:
TITLE: Manatees

Appearance
• look similar to dugongs, but with a differently shaped {{1}}

Movement  
• have fewer neck bones than most mammals
• need to use their {{2}} to help to turn their bodies around

[ANSWERS]:
{{1}} = tail
{{2}} = flippers

[WORD_LIMIT]: 2`;
                                                    setFormData(prev => ({ ...prev, template_content: example }));
                                                }}
                                                style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                📄 Load Example
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, template_content: '' }))}
                                                style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#f87171', border: '1px solid #f87171', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                        <strong style={{ color: '#10b981' }}>Format:</strong> Use {`{{1}}`}, {`{{2}}`}, {`{{3}}`} for answer blanks • Supports ALL IELTS question types • Professional rendering
                                    </div>
                                </div>
                                <textarea
                                    value={formData.template_content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                                    placeholder={`Paste your IELTS template here...`}
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        resize: 'none',
                                        padding: '1rem',
                                        background: 'transparent',
                                        color: 'var(--admin-text)',
                                        border: 'none',
                                        outline: 'none',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6'
                                    }}
                                />
                            </div>
                        )}

                        {/* 1. Prompt Editor (shows when template mode is OFF) */}
                        {!formData.template_mode && (
                            <div className="editor-pane premium-glass" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="pane-header" style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--admin-border)' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>📝 Question Prompt</span>
                                    <div className="rich-toolbar-mini" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                        <button type="button" onClick={() => insertQuestionTag('b')} style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', cursor: 'pointer' }}>Bold</button>
                                        <button type="button" onClick={() => insertQuestionTag('p')} style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', cursor: 'pointer' }}>Para</button>

                                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }}></div>

                                        <button type="button" onClick={handleUndo} disabled={history.undoStack.length === 0} style={{ padding: '2px 8px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--admin-border)', color: history.undoStack.length === 0 ? 'rgba(255,255,255,0.1)' : '#10b981', borderRadius: '4px', cursor: history.undoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: history.undoStack.length === 0 ? 0.3 : 1 }} title="Undo (Ctrl+Z)">↩️</button>
                                        <button type="button" onClick={handleRedo} disabled={history.redoStack.length === 0} style={{ padding: '2px 8px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--admin-border)', color: history.redoStack.length === 0 ? 'rgba(255,255,255,0.1)' : '#8b5cf6', borderRadius: '4px', cursor: history.redoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: history.redoStack.length === 0 ? 0.3 : 1 }} title="Redo (Ctrl+Y)">↪️</button>

                                        <button type="button" onClick={() => {
                                            saveToHistory();
                                            setFormData(prev => ({ ...prev, text: '' }));
                                        }} style={{ padding: '2px 8px', fontSize: '0.8rem', color: '#f87171', border: '1px solid #f87171', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '4px', cursor: 'pointer', marginLeft: '2px' }}>Clear</button>
                                    </div>
                                </div>
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleChange}
                                    placeholder="Type the main question text here. Use the 'Insert HTML' dropdown above for templates..."
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        resize: 'none',
                                        padding: '1rem',
                                        background: 'transparent',
                                        color: 'var(--admin-text)',
                                        border: 'none',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.6'
                                    }}
                                />
                            </div>
                        )}



                        {/* 2. Options Editor (Shows only for relevant types) */}
                        {formData.question_type === 'MCQ' && (
                            <div className="options-config premium-glass" style={{ padding: '1rem' }}>
                                <label style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>⚙️ Answer Options (Check circle to set correct answer)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {formData.options.map((opt, i) => {
                                        const letter = String.fromCharCode(65 + i);
                                        const isCorrect = formData.correct_answer === letter;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--admin-border)', padding: '5px 10px', borderRadius: '6px', border: isCorrect ? '1px solid #4ade80' : '1px solid transparent' }}>
                                                <div
                                                    onClick={() => setFormData(prev => ({ ...prev, correct_answer: letter }))}
                                                    style={{
                                                        width: '20px', height: '20px',
                                                        borderRadius: '50%',
                                                        border: isCorrect ? '2px solid #4ade80' : '2px solid #64748b',
                                                        cursor: 'pointer',
                                                        display: 'grid', placeItems: 'center'
                                                    }}
                                                >
                                                    {isCorrect && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }}></div>}
                                                </div>
                                                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', width: '15px' }}>{letter}.</span>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...formData.options];
                                                        newOpts[i] = e.target.value;
                                                        setFormData(prev => ({ ...prev, options: newOpts }));
                                                    }}
                                                    placeholder={`Option ${letter} `}
                                                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '0.9rem', outline: 'none' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Gap Fill / Note Completion Answer Key Editor - Auto-detected */}
                        {(() => {
                            const gapMatches = formData.text ? formData.text.match(/____(\d+)____/g) : [];
                            if (!gapMatches || gapMatches.length === 0) return null;

                            // Extract the unique numbers and sort them
                            const gapNumbers = [...new Set(gapMatches.map(g => parseInt(g.match(/\d+/)[0])))].sort((a, b) => a - b);

                            return (
                                <div className="options-config premium-glass" style={{ padding: '1rem', marginTop: '1rem' }}>
                                    <label style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem', display: 'block' }}>
                                        🔑 Answer Key for Gaps (Enter the correct answer for each blank)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                        {gapNumbers.map((num) => (
                                            <div key={num} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        background: '#3b82f6', color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                                                        width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {num}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Gap {num}</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.options[num - 1] || ''}
                                                    onChange={(e) => {
                                                        const newOpts = [...formData.options];
                                                        // Ensure the array is large enough
                                                        while (newOpts.length < num) newOpts.push('');
                                                        newOpts[num - 1] = e.target.value;
                                                        setFormData(prev => ({ ...prev, options: newOpts }));
                                                    }}
                                                    placeholder={`Correct Answer for ${num}...`}
                                                    style={{
                                                        background: 'var(--bg-input)', border: '1px solid var(--admin-border)',
                                                        color: 'var(--admin-text)', padding: '8px', borderRadius: '6px', fontSize: '0.9rem', outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* DRAGGER HANDLE */}
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            width: '4px',
                            cursor: 'col-resize',
                            background: isDragging ? 'var(--admin-primary)' : 'var(--admin-border)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            transition: 'background 0.2s',
                            zIndex: 10,
                            margin: '0 2px'
                        }}
                        onMouseOver={(e) => { if (!isDragging) e.currentTarget.style.background = 'var(--admin-primary)'; }}
                        onMouseOut={(e) => { if (!isDragging) e.currentTarget.style.background = 'var(--admin-border)'; }}
                    >
                    </div>

                    {/* Right: Live Preview */}
                    <div className="preview-pane" style={{
                        width: `${100 - leftPaneWidth}%`,
                        background: 'var(--bg-card)',
                        borderRadius: '0 12px 12px 0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-main)'
                    }}>
                        <div className="preview-header" style={{
                            padding: '0.75rem 1rem',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            color: '#475569',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>📱 Student View / Live Preview</span>
                            <span style={{ color: '#94a3b8' }}>{formData.question_type}</span>
                        </div>
                        <div className="preview-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', color: 'var(--text-main)' }}>
                            <div className="student-view-simulation">
                                <SmartText
                                    text={formData.text || '<p style="color:#cbd5e1; text-align:center; margin-top: 2rem;">Start typing to see the question appear here...</p>'}
                                    onLookup={(word, e) => {
                                        e.stopPropagation();
                                        alert(`Vocab Lookup: ${word} (Disabled in builder preview)`);
                                    }}
                                />
                                <div style={{ marginTop: '1.5rem' }}>
                                    <LivePreviewInput type={formData.question_type} options={formData.options} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div >
        </div >
    );
};

export default QuestionBuilderPage;

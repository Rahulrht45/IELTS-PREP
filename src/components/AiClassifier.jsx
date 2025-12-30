import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import './AiClassifier.css';

const SYSTEM_PROMPT = `You are a professional IELTS Question Classifier AI working inside the admin panel of an IELTS preparation website.

Your role is to analyze any IELTS question content provided by the admin (full passages, instructions, and questions) and automatically classify, tag, and organize it correctly according to official Cambridge IELTS standards.

You must work accurately for ALL IELTS SKILLS:
• Reading
• Listening
• Writing
• Speaking

🔹 STEP 1: Identify the IELTS Skill (MANDATORY)
Analyze the content and decide the correct skill:
- Reading → passages with reading-style questions
- Listening → audio-based tasks, conversations, maps, forms
- Writing → tasks asking candidates to write (letter, report, essay)
- Speaking → interview questions, cue cards, discussion prompts

🔹 STEP 2: Detect Academic or General Training
Identify the module type: Academic or General Training

🔹 STEP 3: Identify the EXACT IELTS Question Type
✅ Reading & Listening Question Types:
Multiple Choice, True/False/Not Given, Yes/No/Not Given, Matching Headings, Matching Information, Matching Features, Matching Sentence Endings, Sentence Completion, Summary Completion, Note Completion, Table Completion, Flow-chart Completion, Diagram/Map/Plan Label Completion, Short Answer Questions

✅ Writing Question Types:
Task 1 Academic (graph, chart, table, process, map), Task 1 General (formal/semi-formal/informal letter), Task 2 Essay (Opinion, Discussion, Advantage-Disadvantage, Problem-Solution, Two-part Question)

✅ Speaking Question Types:
Part 1 (Interview), Part 2 (Cue Card), Part 3 (Discussion)

🔹 STEP 4: Assign Learning Category
Selection-based, Logic-based, Matching-based, Completion-based, Direct Answer, Writing, Speaking

🔹 STEP 5: Auto-Map to Website Section
Automatically place the question into the correct website path.

🔹 STEP 6: Validate IELTS Rules (QUALITY CONTROL)
Ensure question type follows Cambridge IELTS format, word limits are correct, no mixed types.

🔹 STEP 7: Structured Output Format (REQUIRED)
Always return in this format:

IELTS Skill: [Reading/Listening/Writing/Speaking]
Module: [Academic / General Training]
Question Type: [Exact type]
Learning Category: [Category]
Website Section Path: [Path]
Confidence Level: [High / Medium / Low]
Short Reason: [1-2 lines explaining why]

❗ IMPORTANT RULES:
❌ Do NOT answer the questions
❌ Do NOT rewrite or modify the content
❌ Do NOT guess if unsure — mark for review
✅ Only analyze, classify, and organize
✅ Be consistent, professional, and accurate`;

const AiClassifier = () => {
    const navigate = useNavigate();
    const [questionContent, setQuestionContent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Audio/Voice states
    const [audioUrl, setAudioUrl] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isSpeakingText, setIsSpeakingText] = useState(false);
    const [useTTS, setUseTTS] = useState(false);
    const [ttsCustomText, setTtsCustomText] = useState('');

    // Text-to-Speech Handler
    const handleTextToSpeech = () => {
        const textToSpeak = ttsCustomText.trim() || questionContent.trim();
        if (!textToSpeak) return;

        if ('speechSynthesis' in window) {
            // Cancel any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'en-GB'; // Default to British English for IELTS
            utterance.rate = 0.9; // Slightly slower for clarity

            utterance.onstart = () => setIsSpeakingText(true);
            utterance.onend = () => setIsSpeakingText(false);
            utterance.onerror = () => setIsSpeakingText(false);

            window.speechSynthesis.speak(utterance);
        } else {
            setError("Your browser does not support Text-to-Speech functionality.");
        }
    };

    const stopTextToSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeakingText(false);
        }
    };

    // Start voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedAudio(url);
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    // Stop voice recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    // Clear recorded audio
    const clearRecording = () => {
        if (recordedAudio) {
            URL.revokeObjectURL(recordedAudio);
        }
        setRecordedAudio(null);
        setAudioBlob(null);
    };

    const handleAnalyze = async () => {
        if (!questionContent.trim()) {
            setError('Please enter question content to analyze.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setAnalysis(null);

        try {
            // TODO: Replace with actual AI API call (Google AI, OpenAI, etc.)
            // For now, using mock analysis
            await mockAIAnalysis(questionContent);
        } catch (err) {
            setError('Analysis failed. Please try again.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const mockAIAnalysis = async (content) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const lowerContent = content.toLowerCase();
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Initialize classification variables
        let skill = 'Reading';
        let module = 'Academic';
        let questionType = 'Multiple Choice';
        let category = 'Selection-based';
        let confidence = 'Medium';
        let reason = 'Detected based on content analysis.';

        // ============================================
        // STEP 1: SKILL DETECTION (Most Important)
        // ============================================

        // WRITING Detection (highest priority)
        const writingIndicators = [
            'write a letter', 'write an essay', 'write about', 'writing task',
            'task 1', 'task 2', 'you should write', 'write at least',
            'give reasons', 'discuss both views', 'to what extent',
            'advantages and disadvantages', 'problems and solutions',
            'formal letter', 'informal letter', 'complaint letter',
            'describe the graph', 'describe the chart', 'describe the diagram',
            'summarize the information', 'compare the data'
        ];

        if (writingIndicators.some(ind => lowerContent.includes(ind))) {
            skill = 'Writing';
            category = 'Writing';
            confidence = 'High';

            // Detect Task 1 vs Task 2
            if (lowerContent.includes('task 1') ||
                lowerContent.includes('graph') ||
                lowerContent.includes('chart') ||
                lowerContent.includes('table') ||
                lowerContent.includes('diagram') ||
                lowerContent.includes('process') ||
                lowerContent.includes('map')) {

                module = 'Academic';
                questionType = 'Task 1 Academic';

                // Specific chart types
                if (lowerContent.includes('bar chart')) questionType = 'Task 1 Academic: Bar Chart';
                else if (lowerContent.includes('line graph')) questionType = 'Task 1 Academic: Line Graph';
                else if (lowerContent.includes('pie chart')) questionType = 'Task 1 Academic: Pie Chart';
                else if (lowerContent.includes('table')) questionType = 'Task 1 Academic: Table';
                else if (lowerContent.includes('process')) questionType = 'Task 1 Academic: Process';
                else if (lowerContent.includes('map')) questionType = 'Task 1 Academic: Map';

                reason = 'Contains Task 1 Academic writing indicators with visual data description.';
            } else if (lowerContent.includes('letter')) {
                module = 'General Training';

                if (lowerContent.includes('dear sir') || lowerContent.includes('dear madam') || lowerContent.includes('formal')) {
                    questionType = 'Task 1 General: Formal Letter';
                } else if (lowerContent.includes('dear') && (lowerContent.includes('friend') || lowerContent.includes('informal'))) {
                    questionType = 'Task 1 General: Informal Letter';
                } else {
                    questionType = 'Task 1 General: Semi-formal Letter';
                }

                reason = 'Contains letter writing task with appropriate formality level.';
            } else {
                // Task 2 Essay
                questionType = 'Task 2 Essay';

                if (lowerContent.includes('agree') || lowerContent.includes('disagree') || lowerContent.includes('opinion')) {
                    questionType = 'Task 2: Opinion Essay';
                } else if (lowerContent.includes('discuss both') || lowerContent.includes('both views')) {
                    questionType = 'Task 2: Discussion Essay';
                } else if (lowerContent.includes('advantages') && lowerContent.includes('disadvantages')) {
                    questionType = 'Task 2: Advantages-Disadvantages';
                } else if (lowerContent.includes('problem') && lowerContent.includes('solution')) {
                    questionType = 'Task 2: Problem-Solution';
                } else if (lowerContent.includes('to what extent')) {
                    questionType = 'Task 2: Opinion Essay';
                }

                reason = 'Contains Task 2 essay writing prompt with clear essay type indicators.';
            }
        }

        // SPEAKING Detection
        else if (lowerContent.includes('speak') ||
            lowerContent.includes('describe a') ||
            lowerContent.includes('talk about') ||
            lowerContent.includes('cue card') ||
            lowerContent.includes('you should say') ||
            (lowerContent.includes('part 1') && lowerContent.includes('interview')) ||
            (lowerContent.includes('part 2') && lowerContent.includes('minutes')) ||
            lowerContent.includes('part 3')) {

            skill = 'Speaking';
            category = 'Speaking';
            confidence = 'High';

            if (lowerContent.includes('part 1') ||
                (lowerContent.includes('interview') && !lowerContent.includes('part 2'))) {
                questionType = 'Part 1: Interview';
                reason = 'Contains Part 1 interview-style questions about familiar topics.';
            } else if (lowerContent.includes('part 2') ||
                lowerContent.includes('cue card') ||
                lowerContent.includes('you should say') ||
                lowerContent.includes('describe a')) {
                questionType = 'Part 2: Cue Card (Long Turn)';
                reason = 'Contains Part 2 cue card with topic description and bullet points.';
            } else if (lowerContent.includes('part 3')) {
                questionType = 'Part 3: Discussion';
                reason = 'Contains Part 3 discussion questions on abstract topics.';
            } else {
                questionType = 'Part 2: Cue Card (Long Turn)';
                reason = 'Contains speaking task with descriptive prompts.';
            }
        }

        // LISTENING Detection
        else if (lowerContent.includes('listen') ||
            lowerContent.includes('audio') ||
            lowerContent.includes('recording') ||
            lowerContent.includes('conversation') ||
            lowerContent.includes('you will hear') ||
            lowerContent.includes('section 1') ||
            lowerContent.includes('section 2') ||
            lowerContent.includes('section 3') ||
            lowerContent.includes('section 4')) {

            skill = 'Listening';
            confidence = 'High';

            // Detect question type for listening
            if (lowerContent.includes('complete the form') ||
                lowerContent.includes('fill in') ||
                lowerContent.includes('complete the notes')) {
                questionType = 'Form/Note Completion';
                category = 'Completion-based';
                reason = 'Contains form or note completion task with blanks to fill.';
            } else if (lowerContent.includes('label the') ||
                lowerContent.includes('map') ||
                lowerContent.includes('diagram')) {
                questionType = 'Map/Diagram Labeling';
                category = 'Completion-based';
                reason = 'Contains map or diagram labeling task.';
            } else if (lowerContent.includes('choose') ||
                lowerContent.includes('select') ||
                /[a-d]\)/.test(lowerContent)) {
                questionType = 'Multiple Choice';
                category = 'Selection-based';
                reason = 'Contains multiple choice questions with options.';
            } else if (lowerContent.includes('match')) {
                questionType = 'Matching';
                category = 'Matching-based';
                reason = 'Contains matching task.';
            } else {
                questionType = 'Sentence Completion';
                category = 'Completion-based';
                reason = 'Contains listening comprehension with completion tasks.';
            }
        }

        // READING Detection (default)
        else {
            skill = 'Reading';
            confidence = 'High';

            // ============================================
            // STEP 2: READING QUESTION TYPE DETECTION
            // ============================================

            // TRUE/FALSE/NOT GIVEN
            if ((lowerContent.includes('true') && lowerContent.includes('false') && lowerContent.includes('not given')) ||
                lowerContent.includes('t/f/ng') ||
                (lowerContent.includes('true') && lowerContent.includes('false') && lowerContent.includes('ng'))) {
                questionType = 'True / False / Not Given';
                category = 'Logic-based';
                reason = 'Contains True/False/Not Given format with logical reasoning required.';
            }

            // YES/NO/NOT GIVEN
            else if ((lowerContent.includes('yes') && lowerContent.includes('no') && lowerContent.includes('not given')) ||
                lowerContent.includes('y/n/ng')) {
                questionType = 'Yes / No / Not Given';
                category = 'Logic-based';
                reason = 'Contains Yes/No/Not Given format for opinion-based statements.';
            }

            // MATCHING HEADINGS
            else if (lowerContent.includes('match') &&
                (lowerContent.includes('heading') || lowerContent.includes('paragraph'))) {
                questionType = 'Matching Headings';
                category = 'Matching-based';
                reason = 'Contains matching headings to paragraphs task.';
            }

            // MATCHING INFORMATION
            else if (lowerContent.includes('match') && lowerContent.includes('information')) {
                questionType = 'Matching Information';
                category = 'Matching-based';
                reason = 'Contains matching information to paragraphs task.';
            }

            // MATCHING FEATURES
            else if (lowerContent.includes('match') &&
                (lowerContent.includes('feature') || lowerContent.includes('name') || lowerContent.includes('date'))) {
                questionType = 'Matching Features';
                category = 'Matching-based';
                reason = 'Contains matching features or characteristics task.';
            }

            // MATCHING SENTENCE ENDINGS
            else if (lowerContent.includes('match') && lowerContent.includes('ending')) {
                questionType = 'Matching Sentence Endings';
                category = 'Matching-based';
                reason = 'Contains matching sentence endings task.';
            }

            // SENTENCE COMPLETION
            else if ((lowerContent.includes('complete the sentence') ||
                lowerContent.includes('finish the sentence')) &&
                !lowerContent.includes('summary')) {
                questionType = 'Sentence Completion';
                category = 'Completion-based';
                reason = 'Contains sentence completion with word limit restrictions.';
            }

            // SUMMARY COMPLETION
            else if (lowerContent.includes('summary') ||
                lowerContent.includes('complete the summary')) {
                questionType = 'Summary Completion';
                category = 'Completion-based';
                reason = 'Contains summary completion task.';
            }

            // NOTE COMPLETION
            else if (lowerContent.includes('note') ||
                lowerContent.includes('complete the notes')) {
                questionType = 'Note Completion';
                category = 'Completion-based';
                reason = 'Contains note completion task.';
            }

            // TABLE COMPLETION
            else if (lowerContent.includes('table') ||
                lowerContent.includes('complete the table')) {
                questionType = 'Table Completion';
                category = 'Completion-based';
                reason = 'Contains table completion task.';
            }

            // FLOW-CHART COMPLETION
            else if (lowerContent.includes('flow') ||
                lowerContent.includes('flowchart') ||
                lowerContent.includes('flow-chart')) {
                questionType = 'Flow-chart Completion';
                category = 'Completion-based';
                reason = 'Contains flow-chart completion task.';
            }

            // DIAGRAM LABELING
            else if (lowerContent.includes('diagram') ||
                lowerContent.includes('label') ||
                lowerContent.includes('plan')) {
                questionType = 'Diagram / Map / Plan Label Completion';
                category = 'Completion-based';
                reason = 'Contains diagram, map, or plan labeling task.';
            }

            // SHORT ANSWER QUESTIONS
            else if (lowerContent.includes('answer the question') ||
                lowerContent.includes('short answer') ||
                (lowerContent.includes('no more than') && lowerContent.includes('word'))) {
                questionType = 'Short Answer Questions';
                category = 'Direct Answer';
                reason = 'Contains short answer questions with word limits.';
            }

            // MULTIPLE CHOICE (default for reading if has options)
            else if (lowerContent.includes('choose') ||
                lowerContent.includes('select') ||
                /[a-d]\)/.test(lowerContent) ||
                lowerContent.includes('which') ||
                lowerContent.includes('what')) {
                questionType = 'Multiple Choice';
                category = 'Selection-based';

                // Check if single or multiple answers
                if (lowerContent.includes('choose two') ||
                    lowerContent.includes('choose three') ||
                    lowerContent.includes('select two')) {
                    questionType = 'Multiple Choice (Multiple Answers)';
                } else {
                    questionType = 'Multiple Choice (Single Answer)';
                }

                reason = 'Contains multiple choice questions with clear options.';
            }

            // COMPLETION (generic fallback)
            else if (lowerContent.includes('complete') ||
                lowerContent.includes('fill')) {
                questionType = 'Sentence Completion';
                category = 'Completion-based';
                reason = 'Contains completion task with blanks to fill.';
            }

            // Default fallback
            else {
                questionType = 'Multiple Choice';
                category = 'Selection-based';
                confidence = 'Low';
                reason = 'Question type unclear - defaulted to Multiple Choice. Please review.';
            }
        }

        // ============================================
        // STEP 3: MODULE DETECTION (Academic vs GT)
        // ============================================
        if (skill === 'Reading' || skill === 'Listening') {
            // Most reading/listening is Academic unless specified
            if (lowerContent.includes('general training') ||
                lowerContent.includes('general test')) {
                module = 'General Training';
            } else {
                module = 'Academic';
            }
        }

        // ============================================
        // STEP 4: INTELLIGENT CONTENT EXTRACTION
        // ============================================

        const extractedData = extractQuestionComponents(questionContent, questionType, skill);

        const sectionPath = `${skill} → ${category} → ${questionType}`;

        setAnalysis({
            skill,
            module,
            questionType,
            category,
            sectionPath,
            confidence,
            reason,
            extractedData  // Add extracted structured data
        });
    };

    // ============================================
    // CONTENT EXTRACTION HELPER FUNCTION
    // ============================================
    const extractQuestionComponents = (content, questionType, skill) => {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const lowerContent = content.toLowerCase();

        let extracted = {
            passage: null,
            questions: [],
            options: [],
            blanks: [],
            table: null,
            instructions: null,
            wordLimit: null
        };

        // Extract passage (for Reading/Listening)
        if (skill === 'Reading' || skill === 'Listening') {
            const passageMarkers = ['passage', 'read the following', 'text:', 'article:'];
            const questionMarkers = ['question', 'choose', 'complete', 'match', 'answer'];

            let passageStart = -1;
            let passageEnd = -1;

            for (let i = 0; i < lines.length; i++) {
                const lineLower = lines[i].toLowerCase();

                // Find passage start
                if (passageStart === -1 && passageMarkers.some(m => lineLower.includes(m))) {
                    passageStart = i + 1;
                }

                // Find passage end (when questions start)
                if (passageStart !== -1 && passageEnd === -1 &&
                    questionMarkers.some(m => lineLower.includes(m))) {
                    passageEnd = i;
                    break;
                }
            }

            if (passageStart !== -1) {
                const endIndex = passageEnd !== -1 ? passageEnd : Math.min(passageStart + 20, lines.length);
                extracted.passage = lines.slice(passageStart, endIndex).join('\n');
            }
        }

        // Extract word limit instructions
        const wordLimitMatch = content.match(/no more than (\w+) word/i);
        if (wordLimitMatch) {
            const numberWords = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
            };
            extracted.wordLimit = numberWords[wordLimitMatch[1].toLowerCase()] || wordLimitMatch[1];
        }

        // Extract instructions
        const instructionMarkers = ['choose', 'complete', 'match', 'answer', 'write', 'describe'];
        for (let line of lines) {
            const lineLower = line.toLowerCase();
            if (instructionMarkers.some(m => lineLower.includes(m)) && line.length < 200) {
                extracted.instructions = line;
                break;
            }
        }

        // ============================================
        // QUESTION TYPE SPECIFIC EXTRACTION
        // ============================================

        // MULTIPLE CHOICE - Extract options
        if (questionType.includes('Multiple Choice')) {
            const optionPattern = /^[A-D][\)\.]\s*(.+)/i;
            const questions = [];
            let currentQuestion = null;

            for (let line of lines) {
                // Detect question number
                if (/^\d+[\.\)]\s*/.test(line) || /^Question \d+/i.test(line)) {
                    if (currentQuestion) questions.push(currentQuestion);
                    currentQuestion = {
                        number: questions.length + 1,
                        text: line.replace(/^\d+[\.\)]\s*/, '').replace(/^Question \d+:?\s*/i, ''),
                        options: []
                    };
                }
                // Detect options
                else if (optionPattern.test(line) && currentQuestion) {
                    const match = line.match(optionPattern);
                    currentQuestion.options.push({
                        label: line.charAt(0).toUpperCase(),
                        text: match[1].trim()
                    });
                }
            }
            if (currentQuestion) questions.push(currentQuestion);
            extracted.questions = questions;
        }

        // TRUE/FALSE/NOT GIVEN - Extract statements
        else if (questionType.includes('True') || questionType.includes('Yes')) {
            const statements = [];
            for (let line of lines) {
                if (/^\d+[\.\)]\s*/.test(line)) {
                    statements.push({
                        number: statements.length + 1,
                        statement: line.replace(/^\d+[\.\)]\s*/, ''),
                        options: questionType.includes('True') ?
                            ['TRUE', 'FALSE', 'NOT GIVEN'] :
                            ['YES', 'NO', 'NOT GIVEN']
                    });
                }
            }
            extracted.questions = statements;
        }

        // COMPLETION TASKS - Extract blanks
        else if (questionType.includes('Completion') || questionType.includes('fill')) {
            const blanks = [];
            const blankPattern = /_{2,}|\((\d+)\)|\.{3,}/g;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (blankPattern.test(line)) {
                    const matches = [...line.matchAll(blankPattern)];
                    matches.forEach((match, idx) => {
                        blanks.push({
                            number: blanks.length + 1,
                            context: line,
                            position: match.index,
                            type: 'fill-in'
                        });
                    });
                }
            }
            extracted.blanks = blanks;

            // Extract as questions too
            const questions = [];
            for (let line of lines) {
                if (/^\d+[\.\)]\s*/.test(line) && blankPattern.test(line)) {
                    questions.push({
                        number: questions.length + 1,
                        text: line.replace(/^\d+[\.\)]\s*/, ''),
                        type: 'completion'
                    });
                }
            }
            extracted.questions = questions;
        }

        // TABLE COMPLETION - Extract table structure
        else if (questionType.includes('Table')) {
            const tableData = extractTable(lines);
            if (tableData) {
                extracted.table = tableData;
            }
        }

        // MATCHING TASKS - Extract items to match
        else if (questionType.includes('Matching')) {
            const items = [];
            const choices = [];
            let inChoices = false;

            for (let line of lines) {
                // Detect numbered items
                if (/^\d+[\.\)]\s*/.test(line)) {
                    items.push({
                        number: items.length + 1,
                        text: line.replace(/^\d+[\.\)]\s*/, '')
                    });
                }
                // Detect lettered choices
                else if (/^[A-Z][\.\)]\s*/.test(line)) {
                    choices.push({
                        label: line.charAt(0),
                        text: line.replace(/^[A-Z][\.\)]\s*/, '')
                    });
                }
            }

            extracted.questions = items;
            extracted.options = choices;
        }

        // SHORT ANSWER - Extract questions
        else if (questionType.includes('Short Answer')) {
            const questions = [];
            for (let line of lines) {
                if (/^\d+[\.\)]\s*/.test(line) || /^Question \d+/i.test(line)) {
                    questions.push({
                        number: questions.length + 1,
                        text: line.replace(/^\d+[\.\)]\s*/, '').replace(/^Question \d+:?\s*/i, ''),
                        type: 'short-answer',
                        wordLimit: extracted.wordLimit
                    });
                }
            }
            extracted.questions = questions;
        }

        return extracted;
    };

    // Helper function to extract table structure
    const extractTable = (lines) => {
        const table = {
            headers: [],
            rows: [],
            blanks: []
        };

        let inTable = false;
        const separatorPattern = /[\|\+\-]{3,}/;
        const cellPattern = /\|/;

        for (let line of lines) {
            // Detect table rows (contains | separators)
            if (cellPattern.test(line) && !separatorPattern.test(line)) {
                const cells = line.split('|')
                    .map(c => c.trim())
                    .filter(c => c.length > 0);

                if (cells.length > 0) {
                    if (table.headers.length === 0) {
                        table.headers = cells;
                    } else {
                        // Check for blanks in cells
                        const row = cells.map((cell, idx) => {
                            if (/_{2,}|\((\d+)\)|\.{3,}/.test(cell)) {
                                table.blanks.push({
                                    row: table.rows.length,
                                    column: idx,
                                    header: table.headers[idx]
                                });
                                return { value: cell, isBlank: true };
                            }
                            return { value: cell, isBlank: false };
                        });
                        table.rows.push(row);
                    }
                }
            }
        }

        return table.headers.length > 0 ? table : null;
    };

    const handleClear = () => {
        setQuestionContent('');
        setAnalysis(null);
        setError('');
        setSuccessMessage('');
        setAudioUrl('');
        clearRecording();
    };

    const handleApprove = async () => {
        if (!analysis) return;

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to add questions.');
            }

            // Extract question text and passage from content
            const lines = questionContent.split('\n');
            let questionText = '';
            let passage = '';

            // Simple extraction logic - you can enhance this
            const contentLower = questionContent.toLowerCase();
            if (contentLower.includes('passage') || contentLower.includes('read the following')) {
                // Likely has a passage
                const passageStart = questionContent.indexOf('\n\n');
                if (passageStart > 0) {
                    passage = questionContent.substring(0, passageStart).trim();
                    questionText = questionContent.substring(passageStart).trim();
                } else {
                    questionText = questionContent;
                }
            } else {
                questionText = questionContent;
            }

            // Map AI question type to database question_type
            let dbQuestionType = 'MCQ'; // default
            const qType = analysis.questionType.toLowerCase();

            if (qType.includes('multiple choice')) {
                dbQuestionType = 'MCQ';
            } else if (qType.includes('true') || qType.includes('false')) {
                dbQuestionType = 'T/F/NG';
            } else if (qType.includes('yes') || qType.includes('no')) {
                dbQuestionType = 'Y/N/NG';
            } else if (qType.includes('completion') || qType.includes('fill') || qType.includes('gap')) {
                dbQuestionType = 'GapFill';
            } else if (qType.includes('essay')) {
                dbQuestionType = 'Essay';
            } else if (qType.includes('letter')) {
                dbQuestionType = 'Letter';
            } else if (qType.includes('part 1')) {
                dbQuestionType = 'Part1';
            } else if (qType.includes('part 2')) {
                dbQuestionType = 'Part2';
            } else if (qType.includes('part 3')) {
                dbQuestionType = 'Part3';
            }

            // Prepare content object
            const content = {
                text: questionText,
                // If TTS is enabled and custom text is provided, use that as the passage source
                passage: (useTTS && ttsCustomText.trim()) ? ttsCustomText.trim() : (passage || null),
                category: analysis.category,
                topic: analysis.questionType,
                audio_generated: useTTS, // Save the TTS preference
                instructions: analysis.extractedData?.instructions || null
            };

            // Force Listening section if TTS is enabled
            const finalSection = useTTS ? 'Listening' : analysis.skill;

            // Insert into database
            const { error: insertError } = await supabase
                .from('questions')
                .insert([{
                    section: finalSection,
                    question_type: dbQuestionType,
                    content: content,
                    options: null, // Can be enhanced to extract options
                    correct_answer: 'To be filled', // Placeholder
                    explanation: `AI Classified: ${analysis.reason}`,
                    difficulty: analysis.confidence === 'High' ? 'Medium' : 'Hard'
                }]);

            if (insertError) throw insertError;

            setSuccessMessage('✅ Question successfully added to database!');

            // Clear form after 2 seconds
            setTimeout(() => {
                handleClear();
            }, 2000);

        } catch (err) {
            console.error('Error saving question:', err);
            setError(`Failed to save: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="ai-classifier-page">
            <div className="classifier-header">
                <button className="back-btn" onClick={() => navigate('/admin')}>
                    ← Back to Admin
                </button>
                <h1>🤖 AI Question Classifier</h1>
                <p className="subtitle">Professional IELTS Content Analysis & Classification</p>
            </div>

            <div className="classifier-layout">
                {/* Left Panel - Input */}
                <div className="input-panel premium-glass">
                    <div className="panel-header">
                        <h2>📝 Question Content</h2>
                        <p>Paste the complete IELTS question, passage, or task</p>
                    </div>

                    <textarea
                        className="content-input"
                        placeholder="Paste your IELTS question content here...

Example formats:
• Reading passage + questions
• Listening transcript + questions
• Writing task instructions
• Speaking cue card or prompts

The AI will automatically detect the skill, type, and category."
                        value={questionContent}
                        onChange={(e) => setQuestionContent(e.target.value)}
                        rows={20}
                    />

                    {/* Audio/Voice Controls */}
                    <div className="audio-controls-section">
                        <div className="audio-section-header">
                            <h4>🎧 Audio/Voice (For Listening & Speaking)</h4>
                            <p>Add audio URL for Listening or record voice for Speaking</p>
                        </div>

                        {/* Audio URL Input for Listening */}
                        <div className="audio-input-group">
                            <label>🔊 Audio URL (Listening Questions):</label>
                            <input
                                type="text"
                                className="audio-url-input"
                                placeholder="https://example.com/audio.mp3"
                                value={audioUrl}
                                onChange={(e) => setAudioUrl(e.target.value)}
                            />
                            {audioUrl && (
                                <audio controls className="audio-preview">
                                    <source src={audioUrl} />
                                    Your browser does not support audio playback.
                                </audio>
                            )}
                        </div>

                        {/* Text-to-Speech Generator */}
                        <div className="tts-group">
                            <label>🗣️ Text-to-Speech (Generate from Text):</label>

                            <textarea
                                className="tts-custom-input"
                                placeholder="Type text here to convert to voice (Optional - overrides main content)..."
                                value={ttsCustomText}
                                onChange={(e) => setTtsCustomText(e.target.value)}
                                rows={3}
                            />

                            <div className="tts-controls">
                                {!isSpeakingText ? (
                                    <button
                                        type="button"
                                        className="tts-btn play"
                                        onClick={handleTextToSpeech}
                                        disabled={!questionContent.trim() && !ttsCustomText.trim()}
                                    >
                                        ▶ Play Passage Audio
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="tts-btn stop"
                                        onClick={stopTextToSpeech}
                                    >
                                        ⏹ Stop Audio
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className={`tts-btn add-voice ${useTTS ? 'active' : ''}`}
                                    onClick={() => {
                                        setUseTTS(true);
                                        setSuccessMessage("✅ Voice script attached to passage! (Will be generated on save)");
                                        setTimeout(() => setSuccessMessage(''), 3000);
                                    }}
                                    disabled={!questionContent.trim() && !ttsCustomText.trim()}
                                >
                                    {useTTS ? '✓ Voice Added' : '➕ Add Voice to Passage'}
                                </button>

                                <div className="tts-save-option">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={useTTS} // We need to define this state
                                            onChange={(e) => setUseTTS(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Save as Audio Question
                                    </label>
                                </div>
                            </div>
                            <span className="tts-hint">
                                {useTTS ? '✅ This question will read the passage aloud to the student.' : 'Check box above to make this a listening question.'}
                            </span>
                        </div>

                        {/* Voice Recording for Speaking */}
                        <div className="voice-recording-group">
                            <label>🎤 Voice Recording (Speaking Questions):</label>
                            <div className="recording-controls">
                                {!isRecording && !recordedAudio && (
                                    <button
                                        className="record-btn"
                                        onClick={startRecording}
                                        type="button"
                                    >
                                        <span className="record-icon">●</span>
                                        Start Recording
                                    </button>
                                )}

                                {isRecording && (
                                    <button
                                        className="stop-btn"
                                        onClick={stopRecording}
                                        type="button"
                                    >
                                        <span className="stop-icon">■</span>
                                        Stop Recording
                                        <span className="recording-indicator">Recording...</span>
                                    </button>
                                )}

                                {recordedAudio && (
                                    <div className="recorded-audio-section">
                                        <audio controls className="audio-preview">
                                            <source src={recordedAudio} type="audio/webm" />
                                            Your browser does not support audio playback.
                                        </audio>
                                        <div className="recording-actions">
                                            <button
                                                className="re-record-btn"
                                                onClick={() => {
                                                    clearRecording();
                                                }}
                                                type="button"
                                            >
                                                🔄 Re-record
                                            </button>
                                            <button
                                                className="delete-recording-btn"
                                                onClick={clearRecording}
                                                type="button"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="recording-hint">
                                💡 Record sample answers for Speaking questions or pronunciation examples
                            </div>
                        </div>
                    </div>

                    <div className="input-actions">
                        <button
                            className="analyze-btn"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !questionContent.trim()}
                        >
                            {isAnalyzing ? (
                                <>
                                    <span className="spinner"></span>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    🔍 Analyze & Classify
                                </>
                            )}
                        </button>
                        <button
                            className="clear-btn"
                            onClick={handleClear}
                        >
                            Clear
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message">{successMessage}</div>}
                </div>

                {/* Right Panel - Results */}
                <div className="results-panel premium-glass">
                    <div className="panel-header">
                        <h2>📊 Classification Results</h2>
                        <p>AI-powered IELTS content analysis</p>
                    </div>

                    {!analysis ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎯</div>
                            <h3>No Analysis Yet</h3>
                            <p>Enter question content and click "Analyze & Classify" to see results</p>

                            <div className="system-prompt-preview">
                                <h4>AI System Capabilities:</h4>
                                <ul>
                                    <li>✅ Identifies all 4 IELTS skills</li>
                                    <li>✅ Detects Academic vs General Training</li>
                                    <li>✅ Recognizes 30+ question types</li>
                                    <li>✅ Auto-maps to website sections</li>
                                    <li>✅ Validates Cambridge IELTS standards</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="analysis-results">
                            <div className="result-item">
                                <label>IELTS Skill:</label>
                                <div className={`value skill-${analysis.skill.toLowerCase()}`}>
                                    {analysis.skill}
                                </div>
                            </div>

                            <div className="result-item">
                                <label>Module:</label>
                                <div className="value">{analysis.module}</div>
                            </div>

                            <div className="result-item">
                                <label>Question Type:</label>
                                <div className="value highlight">{analysis.questionType}</div>
                            </div>

                            <div className="result-item">
                                <label>Learning Category:</label>
                                <div className="value">{analysis.category}</div>
                            </div>

                            <div className="result-item">
                                <label>Website Section Path:</label>
                                <div className="value path">{analysis.sectionPath}</div>
                            </div>

                            <div className="result-item">
                                <label>Confidence Level:</label>
                                <div className={`value confidence-${analysis.confidence.toLowerCase()}`}>
                                    {analysis.confidence}
                                </div>
                            </div>

                            <div className="result-item reason">
                                <label>Analysis Reason:</label>
                                <div className="value">{analysis.reason}</div>
                            </div>

                            {/* EXTRACTED STRUCTURED DATA */}
                            {analysis.extractedData && (
                                <div className="extracted-data-section">
                                    <h3 className="section-title">📋 Extracted Components</h3>

                                    {/* Instructions */}
                                    {analysis.extractedData.instructions && (
                                        <div className="extracted-item">
                                            <label>📝 Instructions:</label>
                                            <div className="extracted-value instruction">
                                                {analysis.extractedData.instructions}
                                            </div>
                                        </div>
                                    )}

                                    {/* Word Limit */}
                                    {analysis.extractedData.wordLimit && (
                                        <div className="extracted-item">
                                            <label>📏 Word Limit:</label>
                                            <div className="extracted-value badge">
                                                {analysis.extractedData.wordLimit} word{analysis.extractedData.wordLimit > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    )}

                                    {/* Passage */}
                                    {analysis.extractedData.passage && (
                                        <div className="extracted-item">
                                            <label>📖 Passage:</label>
                                            <div className="extracted-value passage">
                                                {analysis.extractedData.passage.substring(0, 300)}
                                                {analysis.extractedData.passage.length > 300 && '...'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions with Options (MCQ) */}
                                    {analysis.extractedData.questions && analysis.extractedData.questions.length > 0 && (
                                        <div className="extracted-item">
                                            <label>❓ Questions ({analysis.extractedData.questions.length}):</label>
                                            <div className="questions-list-extracted">
                                                {analysis.extractedData.questions.slice(0, 3).map((q, idx) => (
                                                    <div key={idx} className="question-extracted">
                                                        <div className="question-number">Q{q.number}</div>
                                                        <div className="question-content">
                                                            <div className="question-text">{q.text || q.statement}</div>
                                                            {q.options && q.options.length > 0 && (
                                                                <div className="options-extracted">
                                                                    {q.options.map((opt, oidx) => (
                                                                        <div key={oidx} className="option-extracted">
                                                                            <span className="option-label">{opt.label || opt}</span>
                                                                            {opt.text && <span className="option-text">{opt.text}</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {analysis.extractedData.questions.length > 3 && (
                                                    <div className="more-indicator">
                                                        +{analysis.extractedData.questions.length - 3} more questions
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Blanks (Completion Tasks) */}
                                    {analysis.extractedData.blanks && analysis.extractedData.blanks.length > 0 && (
                                        <div className="extracted-item">
                                            <label>⬜ Blanks ({analysis.extractedData.blanks.length}):</label>
                                            <div className="blanks-list-extracted">
                                                {analysis.extractedData.blanks.slice(0, 5).map((blank, idx) => (
                                                    <div key={idx} className="blank-extracted">
                                                        <span className="blank-number">{blank.number}.</span>
                                                        <span className="blank-context">{blank.context}</span>
                                                    </div>
                                                ))}
                                                {analysis.extractedData.blanks.length > 5 && (
                                                    <div className="more-indicator">
                                                        +{analysis.extractedData.blanks.length - 5} more blanks
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Table Structure */}
                                    {analysis.extractedData.table && (
                                        <div className="extracted-item">
                                            <label>📊 Table Structure:</label>
                                            <div className="table-extracted">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            {analysis.extractedData.table.headers.map((header, idx) => (
                                                                <th key={idx}>{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analysis.extractedData.table.rows.slice(0, 3).map((row, ridx) => (
                                                            <tr key={ridx}>
                                                                {row.map((cell, cidx) => (
                                                                    <td key={cidx} className={cell.isBlank ? 'blank-cell' : ''}>
                                                                        {cell.value}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {analysis.extractedData.table.blanks.length > 0 && (
                                                    <div className="table-info">
                                                        {analysis.extractedData.table.blanks.length} blank(s) detected in table
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Matching Options */}
                                    {analysis.extractedData.options && analysis.extractedData.options.length > 0 && (
                                        <div className="extracted-item">
                                            <label>🔤 Matching Options ({analysis.extractedData.options.length}):</label>
                                            <div className="options-list-extracted">
                                                {analysis.extractedData.options.map((opt, idx) => (
                                                    <div key={idx} className="matching-option">
                                                        <span className="option-label">{opt.label}.</span>
                                                        <span className="option-text">{opt.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="result-actions">
                                <button
                                    className="approve-btn"
                                    onClick={handleApprove}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="spinner"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        '✓ Approve & Add to Database'
                                    )}
                                </button>
                                <button className="edit-btn" onClick={() => navigate('/admin')}>
                                    ✏️ Edit Manually
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Prompt Info */}
            <details className="system-prompt-details premium-glass">
                <summary>🔧 View AI System Prompt</summary>
                <pre className="system-prompt-text">{SYSTEM_PROMPT}</pre>
            </details>
        </div>
    );
};

export default AiClassifier;

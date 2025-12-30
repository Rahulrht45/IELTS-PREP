import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDemoQuestions } from '../../data/demoQuestions';
import './DemoQuestions.css';

const DemoQuestions = () => {
    const navigate = useNavigate();
    const allQuestions = getAllDemoQuestions();

    // Group questions by section
    const groupedQuestions = allQuestions.reduce((acc, question) => {
        if (!acc[question.section]) {
            acc[question.section] = [];
        }
        acc[question.section].push(question);
        return acc;
    }, {});

    const sectionIcons = {
        'Reading': '📖',
        'Listening': '🎧',
        'Writing': '✍️',
        'Speaking': '🗣️'
    };

    return (
        <div className="demo-questions-container">
            <header className="demo-header">
                <h1>📚 IELTS Practice Demo Questions</h1>
                <p>Explore sample questions for all IELTS sections</p>
                <button onClick={() => navigate('/practice')} className="back-btn">
                    ← Back to Practice Library
                </button>
            </header>

            <div className="sections-grid">
                {Object.entries(groupedQuestions).map(([section, questions]) => (
                    <div key={section} className="section-card premium-glass">
                        <div className="section-header">
                            <span className="section-icon">{sectionIcons[section]}</span>
                            <h2>{section}</h2>
                            <span className="question-count">{questions.length} questions</span>
                        </div>

                        <div className="questions-list">
                            {questions.map((question, idx) => (
                                <div
                                    key={question.id}
                                    className="question-item"
                                    onClick={() => navigate(`/practice/${question.id}`, {
                                        state: {
                                            openDrawer: true,
                                            skillFilter: section,
                                            categoryTitle: question.question_type
                                        }
                                    })}
                                >
                                    <div className="question-number">{idx + 1}</div>
                                    <div className="question-details">
                                        <h3>{question.question_type}</h3>
                                        <p>{question.content.text.substring(0, 80)}...</p>
                                    </div>
                                    <div className={`difficulty-badge ${question.difficulty.toLowerCase()}`}>
                                        {question.difficulty}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DemoQuestions;

import React, { useState } from 'react';
import './ScoreTargetModal.css';

const ScoreTargetModal = ({ isOpen, onClose, currentTheme }) => {
    const [examType, setExamType] = useState('PTE');
    const [selectedLevel, setSelectedLevel] = useState('Proficient');
    const [scores, setScores] = useState({
        speaking: 70,
        writing: 68,
        reading: 72,
        listening: 69
    });

    const proficiencyLevels = {
        PTE: [
            { name: 'Vocational', range: '30-49', min: 30, max: 49, color: '#F97316' },
            { name: 'Competent', range: '50-64', min: 50, max: 64, color: '#06B6D4' },
            { name: 'Proficient', range: '65-78', min: 65, max: 78, color: '#10B981' },
            { name: 'Superior', range: '79-90', min: 79, max: 90, color: '#8B5CF6' }
        ],
        IELTS: [
            { name: 'Vocational', range: '4.0-5.0', min: 4.0, max: 5.0, color: '#F97316' },
            { name: 'Competent', range: '5.5-6.0', min: 5.5, max: 6.0, color: '#06B6D4' },
            { name: 'Proficient', range: '6.5-7.5', min: 6.5, max: 7.5, color: '#10B981' },
            { name: 'Superior', range: '8.0-9.0', min: 8.0, max: 9.0, color: '#8B5CF6' }
        ]
    };

    const skills = [
        { name: 'Speaking', key: 'speaking', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316, #FB923C)' },
        { name: 'Writing', key: 'writing', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
        { name: 'Reading', key: 'reading', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
        { name: 'Listening', key: 'listening', color: '#1E40AF', gradient: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }
    ];

    const handleScoreChange = (skill, value) => {
        const maxScore = examType === 'PTE' ? 90 : 9;
        const minScore = examType === 'PTE' ? 10 : 0;
        const step = examType === 'PTE' ? 1 : 0.5;

        let newValue = parseFloat(value);
        if (newValue > maxScore) newValue = maxScore;
        if (newValue < minScore) newValue = minScore;

        setScores({ ...scores, [skill]: newValue });
    };

    const handleProficiencyChange = (level) => {
        setSelectedLevel(level.name);

        // Calculate midpoint of the range for each skill
        const midpoint = examType === 'PTE'
            ? Math.round((level.min + level.max) / 2)
            : parseFloat(((level.min + level.max) / 2).toFixed(1));

        // Update all skill scores to the midpoint of the selected level
        setScores({
            speaking: midpoint,
            writing: midpoint,
            reading: midpoint,
            listening: midpoint
        });
    };

    const getCircleProgress = (score) => {
        const maxScore = examType === 'PTE' ? 90 : 9;
        return (score / maxScore) * 100;
    };

    const handleSave = () => {
        console.log('Saving target:', { examType, selectedLevel, scores });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} data-theme={currentTheme}>
            <div className="score-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-content">
                        <h2>Set Your Score Target</h2>
                        <p>Choose your target proficiency and skill-wise scores</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {/* Exam Type Toggle */}
                <div className="exam-toggle">
                    <button
                        className={`toggle-exam ${examType === 'PTE' ? 'active' : ''}`}
                        onClick={() => setExamType('PTE')}
                    >
                        PTE Academic
                    </button>
                    <button
                        className={`toggle-exam ${examType === 'IELTS' ? 'active' : ''}`}
                        onClick={() => setExamType('IELTS')}
                    >
                        IELTS
                    </button>
                </div>

                {/* Proficiency Level Selector */}
                <div className="proficiency-section">
                    <h3>Proficiency Level</h3>
                    <div className="proficiency-pills">
                        {proficiencyLevels[examType].map((level) => (
                            <button
                                key={level.name}
                                className={`proficiency-pill ${selectedLevel === level.name ? 'selected' : ''}`}
                                onClick={() => handleProficiencyChange(level)}
                                style={{
                                    '--pill-color': level.color,
                                    '--pill-gradient': `linear-gradient(135deg, ${level.color}, ${level.color}dd)`
                                }}
                            >
                                <span className="pill-name">{level.name}</span>
                                <span className="pill-range">{level.range}</span>
                            </button>
                        ))}
                    </div>
                    <p className="helper-text">
                        Proficiency levels indicate overall ability. Individual skill targets may vary.
                    </p>
                </div>

                {/* Skill Score Section */}
                <div className="skills-section">
                    <h3>Individual Skill Targets</h3>
                    <div className="skills-grid">
                        {skills.map((skill) => (
                            <div key={skill.key} className="skill-item">
                                <div className="skill-circle-container">
                                    <svg className="skill-circle" viewBox="0 0 120 120">
                                        <defs>
                                            <linearGradient id={`gradient-${skill.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={skill.color} />
                                                <stop offset="100%" stopColor={`${skill.color}dd`} />
                                            </linearGradient>
                                            <filter id={`glow-${skill.key}`}>
                                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        {/* Background circle */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            fill="none"
                                            stroke="rgba(100, 100, 100, 0.1)"
                                            strokeWidth="8"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            fill="none"
                                            stroke={`url(#gradient-${skill.key})`}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${getCircleProgress(scores[skill.key]) * 3.14} 314`}
                                            transform="rotate(-90 60 60)"
                                            filter={`url(#glow-${skill.key})`}
                                            style={{
                                                transition: 'stroke-dasharray 0.5s ease'
                                            }}
                                        />
                                    </svg>
                                    <div className="skill-score">
                                        <input
                                            type="number"
                                            value={scores[skill.key]}
                                            onChange={(e) => handleScoreChange(skill.key, e.target.value)}
                                            step={examType === 'PTE' ? '1' : '0.5'}
                                            min={examType === 'PTE' ? '10' : '0'}
                                            max={examType === 'PTE' ? '90' : '9'}
                                            className="score-input"
                                        />
                                    </div>
                                </div>
                                <span className="skill-label" style={{ color: skill.color }}>{skill.name}</span>
                                <div className="skill-tooltip">
                                    Students often have different strengths. Skill scores can be set independently.
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave}>Save Target</button>
                </div>
            </div>
        </div>
    );
};

export default ScoreTargetModal;

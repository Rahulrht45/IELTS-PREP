import React from 'react';
import './ExamSimulationSection.css';

const ExamSimulationSection = () => {
    return (
        <section className="exam-simulation-section">
            <div className="simulation-bg-glow glow-teal"></div>
            <div className="simulation-bg-glow glow-violet"></div>

            <div className="simulation-container">
                <div className="simulation-header">
                    <h2 className="simulation-title">
                        Practice Makes <span className="text-gradient-animated">Perfect</span>
                    </h2>
                    <p className="simulation-subtitle">
                        Master your IELTS skills with realistic practice tests and full exam simulations.
                    </p>
                </div>

                <div className="simulation-content-grid">
                    {/* Left Column: Mock Test Card */}
                    <div className="mock-test-preview-wrapper">
                        <div className="mock-test-card glass-panel">
                            <div className="card-header">
                                <div className="test-badge">Intermediate</div>
                                <span className="test-date">Oct 24, 2025</span>
                            </div>

                            <h3 className="mock-test-title">IELTS Complete Mock Test 1</h3>

                            <div className="test-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Listening</span>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Reading</span>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: '78%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="score-display">
                                <span className="score-label">Projected Score</span>
                                <div className="score-value-wrapper">
                                    <span className="score-value">8.0</span>
                                    <span className="score-total">/ 9.0</span>
                                </div>
                            </div>

                            <div className="card-glow-effect"></div>
                        </div>
                        {/* Decorative elements behind card */}
                        <div className="floating-shape shape-1"></div>
                        <div className="floating-shape shape-2"></div>
                    </div>

                    {/* Right Column: Features List */}
                    <div className="simulation-features">
                        <h3 className="features-heading">Complete IELTS Exam Experience</h3>

                        <div className="feature-checklist">
                            <div className="checklist-item">
                                <div className="check-icon-wrapper">
                                    <span className="check-icon">✓</span>
                                </div>
                                <div className="checklist-content">
                                    <h4>Full 4-Section Simulation</h4>
                                    <p>Experience the exact format of the real test with Listening, Reading, Writing, and Speaking modules.</p>
                                </div>
                            </div>

                            <div className="checklist-item">
                                <div className="check-icon-wrapper">
                                    <span className="check-icon">✓</span>
                                </div>
                                <div className="checklist-content">
                                    <h4>Strict Timing Enforcement</h4>
                                    <p>Build endurance and time management skills with our realistic countdown timers.</p>
                                </div>
                            </div>

                            <div className="checklist-item">
                                <div className="check-icon-wrapper">
                                    <span className="check-icon">✓</span>
                                </div>
                                <div className="checklist-content">
                                    <h4>Exam-Day Confidence</h4>
                                    <p>Walk into your exam center knowing exactly what to expect and how to perform.</p>
                                </div>
                            </div>
                        </div>

                        <button className="btn-simulation-cta">
                            Start Free Mock Test
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ExamSimulationSection;

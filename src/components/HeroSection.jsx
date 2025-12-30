import React from 'react';
import '../index.css';
import studentAvatars from '../assets/images/avatars/student_avatars.png';
import badge from '../assets/images/ielts_hero_badge.png';

const HeroSection = () => {
    return (
        <section className="hero-section">
            <div className="hero-container">
                {/* Left Column: Text & CTA */}
                <div className="hero-content">
                    <h1 className="hero-headline">
                        Practice Smart. <span className="highlight-red">Score Higher</span> in IELTS.
                        <svg className="underline-svg" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="#10B981" strokeWidth="3" fill="none" />
                        </svg>
                    </h1>
                    <p className="hero-subtitle">
                        Free mock tests and exam preparation materials to help you achieve your dream band score. Join thousands of successful students today.
                    </p>

                    <div className="hero-cta-group">
                        <button className="btn-primary-red btn-lg">Start Now</button>
                        <div className="social-proof">
                            <img src={studentAvatars} alt="Student Avatars" className="social-avatars" />
                            <p className="social-text"><strong>10,000+</strong> students use our free services</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visuals & Floating Cards */}
                <div className="hero-visuals">
                    <div className="visual-circle-bg"></div>

                    {/* Floating Progress Card */}
                    <div className="floating-card progress-card">
                        <div className="card-header">
                            <span className="card-title">Student Progress</span>
                            <span className="card-icon">📊</span>
                        </div>
                        <div className="progress-item">
                            <span className="progress-label">Listening</span>
                            <div className="progress-bar"><div className="fill blue" style={{ width: '85%' }}></div></div>
                        </div>
                        <div className="progress-item">
                            <span className="progress-label">Reading</span>
                            <div className="progress-bar"><div className="fill green" style={{ width: '90%' }}></div></div>
                        </div>
                        <div className="progress-item">
                            <span className="progress-label">Writing</span>
                            <div className="progress-bar"><div className="fill orange" style={{ width: '75%' }}></div></div>
                        </div>
                        <div className="progress-item">
                            <span className="progress-label">Speaking</span>
                            <div className="progress-bar"><div className="fill red" style={{ width: '80%' }}></div></div>
                        </div>
                    </div>

                    {/* Floating AI Feedback Card */}
                    <div className="floating-card ai-card">
                        <div className="ai-icon-circle">✨</div>
                        <div className="ai-content">
                            <span className="ai-title">AI Feedback</span>
                            <span className="ai-desc">Instant score & tips</span>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="hero-badge-container">
                        <img src={badge} alt="Band 8+ Achieved" className="hero-badge" />
                        <div className="badge-glow"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

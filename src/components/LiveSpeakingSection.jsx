import React from 'react';
import './LiveSpeakingSection.css';

const LiveSpeakingSection = () => {
    return (
        <section className="live-speaking-section">
            <div className="live-container">
                {/* Left Column: Content */}
                <div className="live-content">
                    <h2 className="live-headline">
                        One-on-One Live <br />
                        <span className="text-gradient-neon">IELTS Speaking</span> Sessions
                    </h2>
                    <p className="live-description">
                        Practice with certified IELTS examiners in real-time. Get instant feedback on your pronunciation, fluency, and vocabulary to boost your band score confidently.
                    </p>

                    <div className="feature-grid">
                        <FeatureCard
                            icon="🎥"
                            title="Live Video Sessions"
                            desc="Real-time face-to-face practice"
                        />
                        <FeatureCard
                            icon="👨‍🏫"
                            title="Certified Examiners"
                            desc="Expert feedback from pros"
                        />
                        <FeatureCard
                            icon="📊"
                            title="Detailed Feedback"
                            desc="Score breakdown & tips"
                        />
                        <FeatureCard
                            icon="📅"
                            title="Flexible Scheduling"
                            desc="Book anytime, anywhere"
                        />
                    </div>

                    <button className="btn-live-cta">
                        <span>Notify Me When Live</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                </div>

                {/* Right Column: Video Mockup */}
                <div className="video-mockup-wrapper">
                    <div className="mockup-main-card">

                        {/* Examiner Feed */}
                        <div className="examiner-feed">
                            <div className="live-badge">
                                <span className="recording-dot"></span>
                                LIVE
                            </div>
                            <div className="avatar-placeholder">👨‍🏫</div>
                        </div>

                        {/* Student PiP */}
                        <div className="student-pip">
                            <div className="avatar-placeholder" style={{ fontSize: '2rem', background: '#475569' }}>🎓</div>
                        </div>

                        {/* Controls */}
                        <div className="call-controls">
                            <div className="control-btn">🎤</div>
                            <div className="control-btn">📹</div>
                            <div className="control-btn end-call">📞</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="feature-card">
        <div className="feature-icon-box">{icon}</div>
        <div className="feature-text">
            <h4>{title}</h4>
            <p>{desc}</p>
        </div>
    </div>
);

export default LiveSpeakingSection;

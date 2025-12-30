import React from 'react';
import './GetStartedSection.css';

const GetStartedSection = ({ onRegisterClick }) => {
    return (
        <section className="get-started-section">
            <div className="gs-container">
                <div className="gs-content">
                    <h2 className="gs-title">Unlock Your Full <span className="gs-highlight">IELTS Potential</span></h2>
                    <p className="gs-subtitle">
                        Join 10,000+ students who are already practicing smart with our free mock tests and AI-powered feedback. Start your journey today!
                    </p>
                    <button className="btn-gs-primary" onClick={onRegisterClick}>
                        Get Started for Free
                        <span className="btn-glow"></span>
                    </button>

                    <div className="gs-badges">
                        <div className="gs-badge-item">
                            <span className="badge-icon">✅</span>
                            <span>Free Mock Tests</span>
                        </div>
                        <div className="gs-badge-item">
                            <span className="badge-icon">✨</span>
                            <span>AI Feedback</span>
                        </div>
                        <div className="gs-badge-item">
                            <span className="badge-icon">📈</span>
                            <span>Score Tracking</span>
                        </div>
                    </div>
                </div>

                <div className="gs-visuals">
                    <div className="gs-blob blob-1"></div>
                    <div className="gs-blob blob-2"></div>
                    <div className="gs-floating-card">
                        <div className="mini-chart">
                            <div className="chart-bar" style={{ height: '40%' }}></div>
                            <div className="chart-bar" style={{ height: '70%' }}></div>
                            <div className="chart-bar" style={{ height: '55%' }}></div>
                            <div className="chart-bar" style={{ height: '90%' }}></div>
                        </div>
                        <p>Score Boosting...</p>
                    </div>
                </div>
            </div>
            <div className="gs-background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>
        </section>
    );
};

export default GetStartedSection;

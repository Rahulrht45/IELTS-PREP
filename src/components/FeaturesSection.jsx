import React from 'react';
import './FeaturesSection.css';

const features = [
    {
        icon: '📝',
        color: 'blue',
        title: 'Real IELTS Practice Tests',
        description: 'Experience the actual exam format with our authentic listening, reading, and writing tests.'
    },
    {
        icon: '👥',
        color: 'violet',
        title: 'Community-Driven Learning',
        description: 'Join thousands of students sharing tips, strategies, and success stories in our active community.'
    },
    {
        icon: '📊',
        color: 'teal',
        title: 'Advanced Analytics Dashboard',
        description: 'Track your progress with detailed performance metrics and identify your weak areas instantly.'
    },
    {
        icon: '💡',
        color: 'orange',
        title: 'In-Depth Score Explanations',
        description: 'Understand exactly why you lost points with our comprehensive answer breakdowns and expert tips.'
    },
    {
        icon: '🔓',
        color: 'pink',
        title: '100% Free Access',
        description: 'Get unlimited access to high-quality preparation materials without paying a single penny.'
    },
    {
        icon: '🚀',
        color: 'green',
        title: 'Band Score Improvement',
        description: 'Follow our structured learning path designed to boost your band score by 0.5 - 1.0 points.'
    }
];

const FeaturesSection = () => {
    return (
        <section className="features-section">
            <div className="features-background-glow glow-1"></div>
            <div className="features-background-glow glow-2"></div>

            <div className="features-container">
                <div className="features-header">
                    <h2 className="features-title">Why use IELTS Online Tests?</h2>
                    <p className="features-subtitle">Everything you need to succeed in your IELTS journey</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className={`feature-card card-${feature.color}`}>
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">{feature.icon}</span>
                            </div>
                            <h3 className="feature-card-title">{feature.title}</h3>
                            <p className="feature-card-desc">{feature.description}</p>
                            <div className="feature-hover-glow"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;

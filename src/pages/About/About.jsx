import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-page page-container">
            <div className="about-header">
                <h1>About IELTS Prep</h1>
                <p className="subtitle">Your ultimate partner for exam success.</p>
            </div>

            <div className="about-content">
                <section className="about-section">
                    <h2>Our Mission</h2>
                    <p>
                        We provide high-quality, AI-driven preparation materials for IELTS students worldwide.
                        Our goal is to make premium education accessible to everyone.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default About;

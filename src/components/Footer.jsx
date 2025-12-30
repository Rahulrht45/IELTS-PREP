import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-section">
            <div className="footer-aura"></div>

            <div className="footer-container">
                {/* Top CTA Strip */}
                <div className="footer-cta-wrapper">
                    <div className="footer-cta-text">
                        <h2>Ready to Ace Your IELTS?</h2>
                        <p>Join over 50,000 students achieving Band 7+ with our premium AI-powered platform.</p>
                    </div>
                    <div className="footer-buttons">
                        <button className="btn-glass-signin">Sign In</button>
                        <button className="btn-neon-red">Get Started Now</button>
                    </div>
                </div>

                {/* Main 12-Col Grid */}
                <div className="footer-grid">
                    {/* Brand 4-cols */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <span>IELTS Prep</span>
                        </div>
                        <p className="brand-desc">
                            The world's most advanced IELTS preparation platform. Blending cutting-edge AI with expert-verified methodologies to guarantee your success.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon" aria-label="Twitter">𝕏</a>
                            <a href="#" className="social-icon" aria-label="Instagram">📸</a>
                            <a href="#" className="social-icon" aria-label="LinkedIn">💼</a>
                            <a href="#" className="social-icon" aria-label="Youtube">▶</a>
                        </div>
                    </div>

                    {/* Links 2-cols each */}
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Platform</h4>
                        <ul className="footer-link-list">
                            <li className="footer-link-item"><a href="#" className="footer-link">Exam Simulation</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">Live Speaking</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">AI Writing Check</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">Mobile App</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Resources</h4>
                        <ul className="footer-link-list">
                            <li className="footer-link-item"><a href="#" className="footer-link">Band Score Calc</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">Vocabulary Lists</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">Success Stories</a></li>
                            <li className="footer-link-item"><a href="#" className="footer-link">Blog</a></li>
                        </ul>
                    </div>

                    {/* Newsletter 4-cols */}
                    <div className="footer-newsletter">
                        <h4 className="footer-heading">Stay Updated</h4>
                        <div className="newsletter-box">
                            <p style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                                Get the latest exam tips (and no spam) delivered to your inbox.
                            </p>
                            <div className="newsletter-input-group">
                                <input type="email" placeholder="Enter your email" className="footer-input" />
                                <button className="btn-subscribe">→</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <div className="copyright">
                        © 2024 IELTS Prep Inc. All rights reserved.
                    </div>
                    <div className="footer-legal-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Cookie Settings</a>
                    </div>
                </div>
            </div>

            {/* Chat Pill Button */}
            <div className="chat-widget-btn">
                <span className="chat-dot"></span>
                Chat with us
            </div>
        </footer>
    );
};

export default Footer;

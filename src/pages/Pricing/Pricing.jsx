import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css';
import logo from '../../assets/images/logo.png';

const Pricing = ({ currentTheme, onToggleTheme }) => {
    const [activeView, setActiveView] = useState('subscription');

    const subscriptionPlans = [
        {
            duration: '10 Days',
            price: '৳499',
            originalPrice: '৳599',
            discount: '20% OFF',
            features: ['Premium Access (Web & App)', 'All Practice Modules', 'AI Score Prediction', 'Expert Support'],
            color: '#06B6D4',
            popular: false
        },
        {
            duration: '30 Days',
            price: '৳999',
            originalPrice: '৳1,249',
            discount: '20% OFF',
            features: ['Premium Access (Web & App)', 'All Practice Modules', 'AI Score Prediction', 'Expert Support', 'Mock Test Access'],
            color: '#10B981',
            popular: true
        },
        {
            duration: '60 Days',
            price: '৳1,799',
            originalPrice: '৳2,249',
            discount: '20% OFF',
            features: ['Premium Access (Web & App)', 'All Practice Modules', 'AI Score Prediction', 'Expert Support', 'Unlimited Mock Tests', 'Study Plan'],
            color: '#F87171',
            popular: false
        },
        {
            duration: '90 Days',
            price: '৳2,499',
            originalPrice: '৳3,124',
            discount: '20% OFF',
            features: ['Premium Access (Web & App)', 'All Practice Modules', 'AI Score Prediction', 'Expert Support', 'Unlimited Mock Tests', 'Personalized Study Plan', 'Priority Support'],
            color: '#8B5CF6',
            popular: false
        }
    ];

    const mockTestPlans = [
        {
            duration: '5 Mock Tests',
            price: '৳299',
            originalPrice: '৳374',
            discount: '20% OFF',
            features: ['Full-Length Tests', 'Detailed Analytics', 'Score Reports', 'Performance Tracking'],
            color: '#06B6D4',
            popular: false
        },
        {
            duration: '10 Mock Tests',
            price: '৳499',
            originalPrice: '৳624',
            discount: '20% OFF',
            features: ['Full-Length Tests', 'Detailed Analytics', 'Score Reports', 'Performance Tracking', 'AI Feedback'],
            color: '#10B981',
            popular: true
        },
        {
            duration: '20 Mock Tests',
            price: '৳899',
            originalPrice: '৳1,124',
            discount: '20% OFF',
            features: ['Full-Length Tests', 'Detailed Analytics', 'Score Reports', 'Performance Tracking', 'AI Feedback', 'Expert Review'],
            color: '#F87171',
            popular: false
        },
        {
            duration: 'Unlimited',
            price: '৳1,499',
            originalPrice: '৳1,874',
            discount: '20% OFF',
            features: ['Unlimited Full Tests', 'Advanced Analytics', 'Score Reports', 'Performance Tracking', 'AI Feedback', 'Expert Review', 'Priority Support'],
            color: '#8B5CF6',
            popular: false
        }
    ];

    const currentPlans = activeView === 'subscription' ? subscriptionPlans : mockTestPlans;

    return (
        <div className="pricing-container" data-theme={currentTheme}>
            {/* Navigation Bar */}
            <nav className="pricing-navbar">
                <div className="pricing-nav-left">
                    <img src={logo} alt="Logo" className="pricing-logo" />
                    <span className="pricing-brand">IELTS Master</span>
                    <div className="pricing-nav-links">
                        <Link to="/">Home</Link>
                        <Link to="/dashboard">Practice</Link>
                        <a href="#mock-tests">Mock Tests</a>
                        <Link to="/pricing" className="active">Buy</Link>
                    </div>
                </div>
                <div className="pricing-nav-right">
                    <select className="exam-selector">
                        <option>PTE A / UKVI</option>
                        <option>IELTS</option>
                        <option>TOEFL</option>
                    </select>
                    <button className="icon-btn">🌐</button>
                    <button className="icon-btn">🔔</button>
                    <button onClick={onToggleTheme} className="theme-toggle-pricing">
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div className="user-badge">MD</div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pricing-main">
                <div className="pricing-header">
                    <h1>Choose Your Perfect Plan</h1>
                    <p>Unlock your potential with our premium exam preparation packages</p>
                </div>

                {/* Toggle Buttons */}
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${activeView === 'subscription' ? 'active' : ''}`}
                        onClick={() => setActiveView('subscription')}
                    >
                        Subscription
                    </button>
                    <button
                        className={`toggle-btn ${activeView === 'mockTests' ? 'active' : ''}`}
                        onClick={() => setActiveView('mockTests')}
                    >
                        Mock Tests
                    </button>
                </div>

                {/* Pricing Cards */}
                <div className="pricing-cards-grid">
                    {currentPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                            style={{ '--accent-color': plan.color }}
                        >
                            {plan.popular && <div className="popular-badge">Most Popular</div>}

                            <div className="discount-badge" style={{ background: plan.color }}>
                                {plan.discount}
                            </div>

                            <h3 className="plan-duration">{plan.duration}</h3>

                            <div className="pricing-info">
                                <span className="original-price">{plan.originalPrice}</span>
                                <div className="current-price">{plan.price}</div>
                                <span className="price-period">one-time payment</span>
                            </div>

                            <ul className="features-list">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="check-icon" style={{ color: plan.color }}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="choose-btn"
                                style={{
                                    background: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                                    boxShadow: `0 4px 20px ${plan.color}40`
                                }}
                            >
                                Choose Plan
                            </button>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="trust-section">
                    <div className="trust-item">
                        <span className="trust-icon">🎯</span>
                        <h4>10,000+</h4>
                        <p>Students Enrolled</p>
                    </div>
                    <div className="trust-item">
                        <span className="trust-icon">⭐</span>
                        <h4>4.9/5</h4>
                        <p>Average Rating</p>
                    </div>
                    <div className="trust-item">
                        <span className="trust-icon">🏆</span>
                        <h4>95%</h4>
                        <p>Success Rate</p>
                    </div>
                    <div className="trust-item">
                        <span className="trust-icon">💯</span>
                        <h4>24/7</h4>
                        <p>Expert Support</p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="faq-section">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h4>Can I upgrade my plan later?</h4>
                            <p>Yes! You can upgrade to a longer duration plan at any time. The price difference will be adjusted.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Is there a refund policy?</h4>
                            <p>We offer a 7-day money-back guarantee if you're not satisfied with our platform.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Do I get access to both web and mobile app?</h4>
                            <p>Absolutely! All plans include full access to both our web platform and mobile applications.</p>
                        </div>
                        <div className="faq-item">
                            <h4>What payment methods do you accept?</h4>
                            <p>We accept all major credit cards, debit cards, and mobile banking services.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;

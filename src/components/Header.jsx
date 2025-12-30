import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';
import logo from '../assets/images/logo.png';

const Header = ({ onSignInClick, onGetStartedClick, currentTheme, onToggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo-section" style={{ textDecoration: 'none' }}>
                    <img src={logo} alt="IELTS Prep Logo" className="header-logo" />
                    <span className="logo-text">IELTS <span className="text-red">Prep</span></span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span className="hamburger-icon">☰</span>
                </button>

                {/* Navigation Links */}
                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                    <Link to="/mock-tests" className="nav-link">Mock Tests</Link>
                    <Link to="/help-center" className="nav-link">Help Center</Link>
                    <Link to="/contact" className="nav-link">Contact</Link>
                </nav>

                {/* Actions */}
                <div className="header-actions">
                    <button onClick={onToggleTheme} className="btn-theme-toggle" title="Toggle Theme">
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <div className="header-auth">
                        <button onClick={onSignInClick} className="btn-text">Sign In</button>
                        <button onClick={onGetStartedClick} className="btn-primary-red">Get Started</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;


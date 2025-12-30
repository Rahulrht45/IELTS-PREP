import React, { useState } from 'react';
import './RegisterPage.css'; // Reuse the premium styles
import logo from '../assets/images/logo.png';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLoginSuccess, onSignUpClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (onLoginSuccess) onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page-container">
            {/* Left Panel: Holographic Brand Showcase */}
            <div className="auth-left-panel">
                <div className="brand-showcase">
                    <div className="logo-display">
                        <img src={logo} alt="IELTS Prep Logo" className="logo-img-auth" />
                    </div>
                    <h1 className="brand-heading-auth">Rahul IELTS</h1>
                    <p className="brand-highlight-text">
                        Welcome back! Sign in to continue your journey to <span className="highlight-cyan">Band 9.0</span>.
                    </p>
                </div>
            </div>

            {/* Right Panel: Glass Form */}
            <div className="auth-right-panel">
                <div className="auth-card-glass">
                    <div className="auth-header">
                        <h2 className="auth-title">Student Login</h2>
                        <p className="auth-subtitle">Enter your details to access your dashboard</p>
                    </div>

                    <div className="social-auth-group">
                        <button
                            type="button"
                            className="btn-social-glass btn-google"
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /></svg>
                            Google
                        </button>
                        <button
                            type="button"
                            className="btn-social-glass btn-facebook"
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" /></svg>
                            Facebook
                        </button>
                    </div>

                    {error && <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="auth-form-group">
                            <label className="auth-label">Email Address</label>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="auth-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <a href="#" className="link-cyan" style={{ fontSize: '0.85rem' }}>Forgot Password?</a>
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? 'Signing in...' : 'Login'}
                        </button>

                        <p className="auth-bottom-text">
                            Don't have an account? <span onClick={onSignUpClick} className="link-cyan" style={{ cursor: 'pointer' }}>Create Account</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

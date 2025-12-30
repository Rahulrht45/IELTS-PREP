import React, { useState } from 'react';
import './RegisterPage.css';
import logo from '../assets/images/logo.png';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Country to phone code mapping
const countryPhoneCodes = {
    'Afghanistan': '+93',
    'Albania': '+355',
    'Algeria': '+213',
    'Andorra': '+376',
    'Angola': '+244',
    'United States': '+1',
    'United Kingdom': '+44',
    'Canada': '+1',
    'Australia': '+61',
    'India': '+91',
};

const RegisterPage = ({ onSignInClick }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        country: 'United States',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });

    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const getPhoneCode = () => {
        return countryPhoneCodes[formData.country] || '+1';
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!formData.agreeTerms) {
            setError("You must agree to the Terms & Privacy Policy");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        country: formData.country
                    }
                }
            });

            if (error) throw error;
            alert('Registration Successful! Please check your email.');
            onSignInClick();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let newPassword = "";
        for (let i = 0; i < 16; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        setShowPassword(true);
        setShowConfirmPassword(true);
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
                        Join the elite community of <span className="highlight-cyan">10,000+ Students</span> mastering their future today.
                    </p>
                </div>
            </div>

            {/* Right Panel: Glass Form */}
            <div className="auth-right-panel">
                <div className="auth-card-glass">
                    <div className="auth-header">
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Start your journey to Band 9.0</p>
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

                    <form onSubmit={handleRegister}>
                        <div className="auth-form-group">
                            <label className="auth-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                className="auth-input"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="auth-input"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-row">
                            <div className="auth-col">
                                <label className="auth-label">Phone</label>
                                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '60px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                                        {getPhoneCode()}
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="auth-input"
                                        placeholder="123456789"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                            <div className="auth-col">
                                <label className="auth-label">Country</label>
                                <div className="country-select-wrapper">
                                    <select
                                        name="country"
                                        className="auth-input dark-select"
                                        value={formData.country}
                                        onChange={handleChange}
                                    >
                                        {Object.keys(countryPhoneCodes).map(country => (
                                            <option key={country} value={country} style={{ background: '#0F172A' }}>{country}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="auth-row" style={{ marginTop: '1.5rem' }}>
                            <div className="auth-col">
                                <div className="auth-form-group">
                                    <label className="auth-label">Password</label>
                                    <div className="auth-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            className="auth-input"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            style={{ right: '3rem' }}
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? "Hide Password" : "Show Password"}
                                        >
                                            {showPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            style={{ color: '#22D3EE' }}
                                            onClick={generatePassword}
                                            title="Generate Strong Password"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="auth-col">
                                <div className="auth-form-group">
                                    <label className="auth-label">Confirm</label>
                                    <div className="auth-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            className="auth-input"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                />
                                <span>I agree to the <a href="#" className="link-cyan">Terms</a> & <a href="#" className="link-cyan">Privacy Policy</a></span>
                            </label>
                        </div>

                        <button type="submit" className="btn-auth-primary" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Get Started Now'}
                        </button>

                        <p className="auth-bottom-text">
                            Already have an account? <span onClick={onSignInClick} className="link-cyan" style={{ cursor: 'pointer' }}>Sign in</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Dashboard.css';
import './ReadingGroups.css';
import logo from '../../assets/images/logo.png';
import rahulProfile from '../../assets/images/rahul.png';
import { supabase } from '../../config/supabaseClient';
import ScoreTargetModal from '../../components/ScoreTargetModal';
import ExamCountdownModal from '../../components/ExamCountdownModal';

const Dashboard = ({ user, onSignOut, currentTheme, onToggleTheme }) => {
    const location = useLocation();
    const [isProgCollapsed, setIsProgCollapsed] = useState(true);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'practice');
    const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false);
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

    // Exam Countdown Logic
    const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
    const [targetExamDate, setTargetExamDate] = useState(() => {
        const saved = localStorage.getItem('targetExamDate');
        return saved ? new Date(saved) : null;
    });

    const calculateTimeLeft = (target) => {
        if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const now = new Date();
        const targetDate = new Date(target);
        targetDate.setHours(0, 0, 0, 0);
        const diff = targetDate - now;

        if (diff > 0) {
            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetExamDate));

    useEffect(() => {
        // Update immediately when targetExamDate changes
        setTimeLeft(calculateTimeLeft(targetExamDate));

        if (!targetExamDate) return;

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetExamDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [targetExamDate]);

    const handleSaveExamDate = (date) => {
        setTargetExamDate(date);
        localStorage.setItem('targetExamDate', date.toISOString());
    };

    // Real Calendar Logic
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    const renderCalendarDays = () => {
        const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
        const startDay = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
        const days = [];

        // Empty cells for alignment
        for (let i = 0; i < startDay; i++) {
            days.push(<span key={`empty-${i}`} className="cal-date-empty"></span>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const isToday = today.getDate() === day &&
                today.getMonth() === currentDate.getMonth() &&
                today.getFullYear() === currentDate.getFullYear();
            days.push(
                <span key={day} className={`cal-date ${isToday ? 'active' : ''}`}>
                    {day}
                </span>
            );
        }
        return days;
    };



    const handleSignOut = async () => {
        await supabase.auth.signOut();
        if (onSignOut) onSignOut();
    };

    // Close Practice menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the mega menu and the practice button
            const megaMenu = document.querySelector('.mega-menu');
            const practiceButton = document.querySelector('.nav-link-with-icon');

            if (isPracticeMenuOpen &&
                megaMenu &&
                !megaMenu.contains(event.target) &&
                practiceButton &&
                !practiceButton.contains(event.target)) {
                setIsPracticeMenuOpen(false);
            }
        };

        // Add event listener when menu is open
        if (isPracticeMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPracticeMenuOpen]);


    return (
        <div className="adv-dashboard-container" data-theme={currentTheme}>
            {/* Top Navbar */}
            <nav className="adv-navbar">
                <div className="nav-left">
                    <img src={logo} alt="Logo" className="nav-logo" />
                    <span className="nav-brand">IELTS Master</span>
                    <div className="nav-links">
                        <a href="#home">Home</a>
                        <div className={`nav-item-dropdown ${isPracticeMenuOpen ? 'open' : ''}`}>
                            <a
                                href="#practice"
                                className="nav-link-with-icon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsPracticeMenuOpen(!isPracticeMenuOpen);
                                }}
                            >
                                Practice <span className="chevron-down">▼</span>
                            </a>
                            <div className="mega-menu">
                                <div className="mega-menu-content">
                                    <div className="mega-col speaking">
                                        <div className="col-header">
                                            <span className="col-icon">🎙️</span>
                                            <h4>Speaking</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            {/* Part 1: Introduction & Interview */}
                                            <div className="reading-mega-group speaking-group">
                                                <div className="group-header">
                                                    <h5>Part 1: Introduction</h5>
                                                </div>
                                            </div>

                                            {/* Part 2: Long Turn (Cue Card) */}
                                            <div className="reading-mega-group speaking-group">
                                                <div className="group-header">
                                                    <h5>Part 2: Cue Card</h5>
                                                </div>
                                            </div>

                                            {/* Part 3: Discussion */}
                                            <div className="reading-mega-group speaking-group">
                                                <div className="group-header">
                                                    <h5>Part 3: Discussion</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col writing">
                                        <div className="col-header">
                                            <span className="col-icon">✍️</span>
                                            <h4>Writing</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            {/* Task 1: Academic */}
                                            <div className="reading-mega-group writing-group">
                                                <div className="group-header">
                                                    <h5>Task 1: Academic</h5>
                                                </div>
                                            </div>

                                            {/* Task 1: General Training */}
                                            <div className="reading-mega-group writing-group">
                                                <div className="group-header">
                                                    <h5>Task 1: General</h5>
                                                </div>
                                            </div>

                                            {/* Task 2: Essay Writing */}
                                            <div className="reading-mega-group writing-group">
                                                <div className="group-header">
                                                    <h5>Task 2: Essay</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col reading">
                                        <div className="col-header">
                                            <span className="col-icon">📖</span>
                                            <h4>Reading</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            {/* Group 1: Multiple Choice */}
                                            <div className="reading-mega-group">
                                                <div className="group-header">
                                                    <h5>Multiple Choice</h5>
                                                </div>
                                            </div>

                                            {/* Group 2: True/False Assessment */}
                                            <div className="reading-mega-group">
                                                <div className="group-header">
                                                    <h5>True/False Assessment</h5>
                                                </div>
                                            </div>

                                            {/* Group 3: Matching Tasks */}
                                            <div className="reading-mega-group">
                                                <div className="group-header">
                                                    <h5>Matching Tasks</h5>
                                                </div>
                                            </div>

                                            {/* Group 4: Completion Tasks */}
                                            <div className="reading-mega-group">
                                                <div className="group-header">
                                                    <h5>Completion Tasks</h5>
                                                </div>
                                            </div>

                                            {/* Group 5: Short Answers */}
                                            <div className="reading-mega-group">
                                                <div className="group-header">
                                                    <h5>Short Answers</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col listening">
                                        <div className="col-header">
                                            <span className="col-icon">🎧</span>
                                            <h4>Listening</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            {/* Section 1: Everyday Conversation */}
                                            <div className="reading-mega-group listening-group">
                                                <div className="group-header">
                                                    <h5>Section 1: Conversation</h5>
                                                </div>
                                            </div>

                                            {/* Section 2: Monologue */}
                                            <div className="reading-mega-group listening-group">
                                                <div className="group-header">
                                                    <h5>Section 2: Monologue</h5>
                                                </div>
                                            </div>

                                            {/* Section 3: Academic Discussion */}
                                            <div className="reading-mega-group listening-group">
                                                <div className="group-header">
                                                    <h5>Section 3: Discussion</h5>
                                                </div>
                                            </div>

                                            {/* Section 4: Academic Lecture */}
                                            <div className="reading-mega-group listening-group">
                                                <div className="group-header">
                                                    <h5>Section 4: Lecture</h5>
                                                </div>
                                            </div>

                                            {/* Question Types */}
                                            <div className="reading-mega-group listening-group">
                                                <div className="group-header">
                                                    <h5>Question Types</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mega-footer">
                                    <div className="footer-header">
                                        <span className="footer-icon">🛠️</span>
                                        <h4>Study tools</h4>
                                    </div>
                                    <div className="footer-links">
                                        <span>Templates</span>
                                        <span>Predictions</span>
                                        <span>Grammar</span>
                                        <span>Vocab Bank</span>
                                        <span>Strategy Videos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="#hiate">Hiate</a>
                        <a href="/pricing">Buy</a>
                        <a href="/practice" className="nav-link">Library</a>
                        <a href="#resources">Resources</a>
                        <a href="/admin" className="nav-admin-btn">Admin Panel</a>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-search">
                        <input type="text" placeholder="Search" />
                        <span className="search-icon">🔍</span>
                    </div>
                    <button onClick={onToggleTheme} className="theme-toggle">
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div className="nav-account" onClick={handleSignOut}>
                        <img src={rahulProfile} alt="Profile" className="nav-acc-img" />
                        <span>Account</span>
                    </div>
                </div>
            </nav>


            {/* Analytics Row Section */}
            <div className="analytics-row-section">
                <div className="analytics-header">
                    <div className="refresh-box">
                        <div className="refresh-icon-bg">
                            <span className="refresh-icon">🔄</span>
                        </div>
                        <h3>Refresh Analytics</h3>
                    </div>
                    <div className="last-updated">
                        Last updated on 27/12/2025
                    </div>
                </div>

                <div className="analytics-card-row">
                    {[
                        { num: '1470', label: 'Prediction Questions', color: '#EF4444', percent: '0%' },
                        { num: '8817', label: 'Speaking Questions', color: '#F97316', percent: '0%' },
                        { num: '891', label: 'Writing Questions', color: '#3B82F6', percent: '0%' },
                        { num: '3428', label: 'Reading Questions', color: '#10B981', percent: '0%' },
                        { num: '5898', label: 'Listening Questions', color: '#1E40AF', percent: '0%' }
                    ].map((stat, i) => (
                        <div key={i} className="analytics-stat-card">
                            <div className="stat-main">
                                <span className="stat-number" style={{ color: stat.color }}>{stat.num}</span>
                                <span className="stat-percent-pill" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                                    {stat.percent}
                                </span>
                            </div>
                            <div className="stat-progress-bar" style={{ backgroundColor: stat.color + '20' }}>
                                <div className="stat-progress-fill" style={{ width: '15%', backgroundColor: stat.color }}></div>
                            </div>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div >

            <div className="dashboard-grid-wrapper">
                {/* Left Section: Quick Stats */}
                <section className="dashboard-left-col">
                    <div className="card mini-performance-card">
                        <h3>Overall Score</h3>
                        <div className="mini-perf-stat">
                            <div className="stat-circle">
                                <span className="stat-num">7.5</span>
                                <span className="stat-unit">Band</span>
                            </div>
                            <div className="stat-details">
                                <p>Progress: <strong>45%</strong></p>
                                <p>Target: <strong>8.0</strong></p>
                            </div>
                        </div>
                    </div>

                    <div className="card recent-activity-card">
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            <div className="activity-item">
                                <span className="activity-icon">🎧</span>
                                <div className="activity-info">
                                    <p>Listening Practice</p>
                                    <label>2 hours ago</label>
                                </div>
                            </div>
                            <div className="activity-item">
                                <span className="activity-icon">🎤</span>
                                <div className="activity-info">
                                    <p>Speaking Test</p>
                                    <label>5 hours ago</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Middle Section: Detailed Progress & Modules */}
                <section className="dashboard-mid-col">
                    <div className="dashboard-mid-header">
                        <div className="tab-navigation-outer">
                            <div className="tabs-left">
                                <button
                                    className={`tab-btn-outer ${activeTab === 'practice' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('practice')}
                                >
                                    Practice Progress
                                </button>
                                <button
                                    className={`tab-btn-outer ${activeTab === 'performance' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('performance')}
                                >
                                    Performance Progress
                                </button>
                            </div>
                            {activeTab === 'performance' && (
                                <div className="perf-search-box-outer">
                                    <input type="text" placeholder="Search questions..." />
                                    <button className="search-btn">🔍</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeTab === 'practice' ? (
                        <div className={`card practice-progress-main ${isProgCollapsed ? 'collapsed' : ''}`}>
                            <div className="prog-header" onClick={() => setIsProgCollapsed(!isProgCollapsed)} style={{ cursor: 'pointer' }}>
                                <h2>View Practice Progress</h2>
                                <div className="prog-filters">
                                    <span>Days</span>
                                    <select className="prog-select" onClick={(e) => e.stopPropagation()}>
                                        <option>All</option>
                                        <option>Today</option>
                                        <option>Week</option>
                                    </select>
                                    <span className={`chevron-toggle ${isProgCollapsed ? 'collapsed' : ''}`}>
                                        {isProgCollapsed ? '▼' : '▲'}
                                    </span>
                                </div>
                            </div>

                            {!isProgCollapsed && (
                                <div className="prog-content-grid four-col">
                                    {/* Column 1: Speaking */}
                                    <div className="prog-section orange">
                                        <h4 className="prog-title">Speaking</h4>
                                        {[
                                            { l: 'Read Aloud', v: '0/1548' },
                                            { l: 'Repeat Sentence', v: '0/3156' },
                                            { l: 'Describe Image', v: '0/1173' },
                                            { l: 'Re-Tell Lecture', v: '0/575' },
                                            { l: 'Answer Short Question', v: '0/1926' },
                                            { l: 'Summarize Group Discussion', v: '0/181' },
                                            { l: 'Respond to a Situation', v: '0/258' }
                                        ].map((item, i) => (
                                            <div key={i} className="prog-item">
                                                <div className="prog-item-text">
                                                    <span>{item.l}</span>
                                                    <span className="val">{item.v}</span>
                                                </div>
                                                <div className="prog-underline"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Column 2: Writing */}
                                    <div className="prog-section blue">
                                        <h4 className="prog-title">Writing</h4>
                                        {[
                                            { l: 'Summarize Written Text', v: '0/431' },
                                            { l: 'Write Essay', v: '0/460' }
                                        ].map((item, i) => (
                                            <div key={i} className="prog-item">
                                                <div className="prog-item-text">
                                                    <span>{item.l}</span>
                                                    <span className="val">{item.v}</span>
                                                </div>
                                                <div className="prog-underline"></div>
                                            </div>
                                        ))}

                                        {/* Mock Tests (Moved under Writing or separate?) 
                                           The prompt asked for Speaking, Writing, Reading, Listening. 
                                           I will put Mock Tests at the bottom of Writing for now to balance, 
                                           or maybe strictly 4 cols? 
                                           The prompt says "Four-column layout: Speaking, Writing, Reading, Listening". 
                                           It doesn't mention Mock Tests. I'll keep them in Writing column to avoid losing them.
                                        */}
                                        <div className="prog-section red" style={{ marginTop: '2rem' }}>
                                            <h4 className="prog-title">Mock Tests</h4>
                                            {[
                                                { l: 'Full Mock Tests', v: '0/147' },
                                                { l: 'Sectional Mock Tests', v: '0/328' }
                                            ].map((item, i) => (
                                                <div key={i} className="prog-item">
                                                    <div className="prog-item-text">
                                                        <span>{item.l}</span>
                                                        <span className="val">{item.v}</span>
                                                    </div>
                                                    <div className="prog-underline"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Column 3: Reading */}
                                    <div className="prog-section green">
                                        <h4 className="prog-title">Reading</h4>
                                        {[
                                            {
                                                group: 'Multiple Choice',
                                                desc: 'Choose the correct answer',
                                                items: [
                                                    { l: 'Single Answer Questions', v: '0/250' },
                                                    { l: 'Multiple Answer Questions', v: '0/180' },
                                                    { l: 'Sentence Ending Match', v: '0/150' }
                                                ]
                                            },
                                            {
                                                group: 'True/False Assessment',
                                                desc: 'Verify statement accuracy',
                                                items: [
                                                    { l: 'True / False / Not Given', v: '0/300' },
                                                    { l: 'Yes / No / Not Given', v: '0/280' }
                                                ]
                                            },
                                            {
                                                group: 'Matching Tasks',
                                                desc: 'Connect related information',
                                                items: [
                                                    { l: 'Heading Matching', v: '0/210' },
                                                    { l: 'Information Matching', v: '0/190' },
                                                    { l: 'Feature Matching', v: '0/160' }
                                                ]
                                            },
                                            {
                                                group: 'Completion Tasks',
                                                desc: 'Fill in missing information',
                                                items: [
                                                    { l: 'Sentence Completion', v: '0/220' },
                                                    { l: 'Summary Completion', v: '0/240' },
                                                    { l: 'Note Completion', v: '0/150' },
                                                    { l: 'Table Completion', v: '0/130' },
                                                    { l: 'Flowchart Completion', v: '0/110' },
                                                    { l: 'Diagram Labeling', v: '0/90' }
                                                ]
                                            },
                                            {
                                                group: 'Short Answers',
                                                desc: 'Provide brief responses',
                                                items: [
                                                    { l: 'Short Answer Questions', v: '0/170' }
                                                ]
                                            }
                                        ].map((grp, i) => (
                                            <div key={i} className="reading-group-block">
                                                <div className="r-group-header">
                                                    <h5 className="r-group-title">{grp.group}</h5>
                                                    <span className="r-group-desc">{grp.desc}</span>
                                                </div>
                                                {grp.items.map((item, idx) => (
                                                    <div key={idx} className="prog-item">
                                                        <div className="prog-item-text">
                                                            <span>{item.l}</span>
                                                            <span className="val">{item.v}</span>
                                                        </div>
                                                        <div className="prog-underline"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Column 4: Listening */}
                                    <div className="prog-section dark-blue">
                                        <h4 className="prog-title">Listening</h4>
                                        {[
                                            { l: 'Summarize Spoken Text', v: '0/641' },
                                            { l: 'Multiple Choice, Single Answer', v: '0/204' },
                                            { l: 'Fill in the Blanks', v: '0/417' },
                                            { l: 'Highlight Correct Summary', v: '0/153' },
                                            { l: 'Multiple Choice, Multiple Answers', v: '0/193' },
                                            { l: 'Select Missing Word', v: '0/204' },
                                            { l: 'Highlight Incorrect Words', v: '0/513' },
                                            { l: 'Write from Dictation', v: '0/3573' }
                                        ].map((item, i) => (
                                            <div key={i} className="prog-item">
                                                <div className="prog-item-text">
                                                    <span>{item.l}</span>
                                                    <span className="val">{item.v}</span>
                                                </div>
                                                <div className="prog-underline"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="performance-container-transparent">
                            <div className="perf-controls-row">
                                <div className="perf-legend">
                                    <span className="leg-item"><i className="dot orange"></i> Speaking</span>
                                    <span className="leg-item"><i className="dot green"></i> Reading</span>
                                    <span className="leg-item"><i className="dot blue"></i> Writing</span>
                                    <span className="leg-item"><i className="dot dark-blue"></i> Listening</span>
                                </div>
                                <div className="perf-actions">
                                    <div className="days-filter">
                                        <span>Days</span>
                                        <div className="days-select">7 <span>▼</span></div>
                                    </div>
                                    <button className="btn-detailed-analytics">View Detailed Analytics</button>
                                </div>
                            </div>

                            <div className="perf-chart-section">
                                <div className="chart-y-axis">
                                    {[90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(val => <span key={val}>{val}</span>)}
                                </div>
                                <div className="chart-main">
                                    <div className="chart-grid">
                                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="grid-line"></div>)}
                                        <svg className="chart-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            <path d="M 0 100 L 100 100" stroke="#10B981" strokeWidth="1" fill="none" />
                                            <circle cx="0" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="16.6" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="33.3" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="50" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="66.6" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="83.3" cy="100" r="1.5" fill="#10B981" />
                                            <circle cx="100" cy="100" r="1.5" fill="#10B981" />
                                        </svg>
                                    </div>
                                    <div className="chart-x-axis">
                                        {['21 Dec, 25', '22 Dec, 25', '23 Dec, 25', '24 Dec, 25', '25 Dec, 25', '26 Dec, 25', '27 Dec, 25'].map(date => (
                                            <span key={date}>{date}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="perf-mock-grid">
                                <div className="mock-perf-card shadowless">
                                    <div className="mock-card-header">Full Mock Tests</div>
                                    <div className="mock-card-content">
                                        <div className="donut-chart orange">
                                            <div className="donut-inner"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mock-perf-card shadowless">
                                    <div className="mock-card-header">Sectional Mock Tests</div>
                                    <div className="mock-card-content">
                                        <div className="donut-chart orange-light">
                                            <div className="donut-inner"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'library' && (
                        /* Removed Library Tab Content */
                        null
                    )}

                    <div className="module-grid">
                        {[
                            { title: 'Templates', icon: '📝', color: '#10B981' },
                            { title: 'Predictions', icon: '📹', color: '#06B6D4' },
                            { title: 'Strategy Videos', icon: '💻', color: '#2DD4BF' },
                            { title: 'Vocab Bank', icon: '📕', color: '#EF4444', badge: '!' },
                            { title: 'Score Feedback', icon: '📊', color: '#1E40AF', badge: 'i' },
                            { title: 'Compatibility', icon: '💻', color: '#F59E0B', badge: 'i' },
                            { title: 'Mock Tests', icon: '📒', color: '#A855F7' },
                            { title: 'MT Scores', icon: '📋', color: '#0EA5E9' }
                        ].map((mod, idx) => (
                            <div key={idx} className="module-card">
                                <div className="mod-icon-wrapper" style={{ backgroundColor: mod.color + '20' }}>
                                    <span className="mod-icon" style={{ color: mod.color }}>{mod.icon}</span>
                                    {mod.badge && <span className="mod-badge" style={{
                                        background: mod.badge === 'i' ? mod.color : 'var(--coral-grad)',
                                        fontSize: mod.badge === 'i' ? '0.6rem' : '0.8rem'
                                    }}>{mod.badge}</span>}
                                </div>
                                <span className="mod-title" style={{ color: mod.color }}>{mod.title}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bottom-practice-row">
                        <div className="practice-card speech-test">
                            <span className="prac-card-badge">i</span>
                            <div className="prac-header">
                                <div className="prac-icon-circle mic-orange">🎙️</div>
                                <div>
                                    <h3>Speech Test</h3>
                                    <p>Click the mic button to speak</p>
                                </div>
                            </div>
                            <div className="prac-input-group">
                                <input type="text" placeholder="Your Response..." />
                                <button className="btn-refresh-orange">Refresh 🔄</button>
                            </div>
                            <div className="prac-bar-container">
                                <div className="prac-bar-fill orange"></div>
                            </div>
                        </div>

                        <div className="practice-card listening-test">
                            <span className="prac-card-badge">i</span>
                            <div className="prac-header">
                                <div className="prac-icon-circle phone-blue">🎧</div>
                                <div>
                                    <div className="title-with-subtitle">
                                        <h3>Listening Test</h3>
                                        <span className="subtitle">Difficult words from WFD & LFIB</span>
                                    </div>
                                    <p>Click the headphone button to listen</p>
                                </div>
                            </div>
                            <div className="prac-input-group">
                                <input type="text" placeholder="Your Response..." />
                                <button className="btn-next-blue">Next ➡️</button>
                            </div>
                            <button className="btn-show-word">Show Word</button>
                        </div>
                    </div>
                </section>

                {/* Right Section: Sidebar */}
                <section className="dashboard-right-col">
                    <div className="score-target-widget">
                        <div className="score-box teal">
                            <button className="score-settings-icon" onClick={() => setIsScoreModalOpen(true)}>⚙️</button>
                            <span className="score-val">58 - 76</span>
                            <span className="score-label">Proficient</span>
                            <span className="score-target">Your Target</span>
                        </div>
                        <div className="countdown-box">
                            <div className="countdown-header">
                                <span className="countdown-title">Exam Countdown</span>
                                <div className="countdown-icons">
                                    <button
                                        className="icon-btn-small settings-icon"
                                        onClick={() => setIsCountdownModalOpen(true)}
                                    >
                                        ⚙️
                                    </button>
                                    <button className="icon-btn-small info-icon" title={targetExamDate ? `Target: ${new Date(targetExamDate).toLocaleDateString()}` : "Set your exam date"}>ℹ️</button>
                                </div>
                            </div>
                            <div className="countdown-timer">
                                <div className="time">
                                    <span className="time-value">{String(timeLeft.days).padStart(2, '0')}</span>
                                    <label className="time-label">Days</label>
                                </div>
                                <div className="time">
                                    <span className="time-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <label className="time-label">Hours</label>
                                </div>
                                <div className="time">
                                    <span className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <label className="time-label">Minutes</label>
                                </div>
                                <div className="time">
                                    <span className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <label className="time-label">Seconds</label>
                                </div>
                            </div>
                            {/* Prompt to set date if not set */}
                            {!targetExamDate && (
                                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
                                    Tap ⚙️ to set date
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card calendar-card">
                        <div className="cal-header">
                            <h3>Study Plan</h3>
                            <div className="cal-nav">
                                <span onClick={() => changeMonth(-1)} style={{ cursor: 'pointer' }}>&lt;</span>
                                <strong>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</strong>
                                <span onClick={() => changeMonth(1)} style={{ cursor: 'pointer' }}>&gt;</span>
                            </div>
                        </div>
                        <div className="cal-grid">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="cal-day-name">{d}</span>)}
                            {renderCalendarDays()}
                        </div>
                    </div>

                    <div className="card focus-card">
                        <h3>Today's Focus</h3>
                        <div className="social-icons">
                            <span className="soc-fb">f</span>
                            <span className="soc-ig">📸</span>
                            <span className="soc-in">in</span>
                            <span className="soc-tg">✈️</span>
                            <span className="soc-x">X</span>
                            <span className="soc-yt">▶️</span>
                        </div>
                    </div>

                    <div className="card referral-card">
                        <div className="ref-header">
                            <h3>Refer & Friend</h3>
                            <span className="close-x">×</span>
                        </div>
                        <div className="ref-content">
                            <div className="ref-icon">👤</div>
                            <div className="ref-text">
                                <p><strong>Refer a Friend</strong></p>
                                <p>Please solve upgrade test of query your Premium Ducking first Study-Plan</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div >

            {/* Score Target Modal */}
            < ScoreTargetModal
                isOpen={isScoreModalOpen}
                onClose={() => setIsScoreModalOpen(false)}
                currentTheme={currentTheme}
            />

            <ExamCountdownModal
                isOpen={isCountdownModalOpen}
                onClose={() => setIsCountdownModalOpen(false)}
                onSave={handleSaveExamDate}
                currentDate={targetExamDate}
            />
        </div >
    );
};

export default Dashboard;

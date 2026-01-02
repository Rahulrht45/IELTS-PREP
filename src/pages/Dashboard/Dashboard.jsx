import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';
import './ReadingGroups.css';
import './DrillDown.css';
import logo from '../../assets/images/logo.png';
import rahulProfile from '../../assets/images/rahul.png';
import { supabase } from '../../config/supabaseClient';
import ScoreTargetModal from '../../components/ScoreTargetModal';
import ExamCountdownModal from '../../components/ExamCountdownModal';

const Dashboard = ({ user, onSignOut, currentTheme, onToggleTheme }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isProgCollapsed, setIsProgCollapsed] = useState(true);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'practice');
    const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false);
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [activeDrillDown, setActiveDrillDown] = useState(null);

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


    const navigateToCategory = async (skill, category) => {
        setIsPracticeMenuOpen(false);
        try {
            // Smart Navigation: Find the first question in this category to start practice instantly
            const { data, error } = await supabase
                .from('questions')
                .select('id')
                .eq('section', skill)
                .limit(1);

            if (data && data.length > 0) {
                // Navigate directly to the first question and signal to open the drawer
                navigate(`/practice/${data[0].id}`, {
                    state: {
                        openDrawer: true,
                        skillFilter: skill,
                        categoryTitle: category
                    }
                });
            } else {
                // Fallback to library if no questions available
                navigate('/practice', { state: { filter: skill, catFilter: category } });
            }
        } catch (err) {
            console.error("Navigation error:", err);
            navigate('/practice', { state: { filter: skill, catFilter: category } });
        }
    };

    return (
        <div className="adv-dashboard-container" data-theme={currentTheme}>
            {/* Top Navbar */}
            <nav className="adv-navbar">
                <div className="nav-left">
                    <img src={logo} alt="Logo" className="nav-logo" />
                    <span className="nav-brand">IELTS Master</span>
                    <div className="nav-links">
                        <Link to="/dashboard">Home</Link>
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
                                        <div className="col-header" onClick={() => navigateToCategory('Speaking', null)}>
                                            <span className="col-icon">🎙️</span>
                                            <h4>Speaking</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            <div className="reading-mega-group speaking-group" onClick={() => navigateToCategory('Speaking', 'Part 1: Introduction')}>
                                                <div className="group-header">
                                                    <h5>Part 1: Introduction</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group speaking-group" onClick={() => navigateToCategory('Speaking', 'Part 2: Cue Card')}>
                                                <div className="group-header">
                                                    <h5>Part 2: Cue Card</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group speaking-group" onClick={() => navigateToCategory('Speaking', 'Part 3: Discussion')}>
                                                <div className="group-header">
                                                    <h5>Part 3: Discussion</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col writing">
                                        <div className="col-header" onClick={() => navigateToCategory('Writing', null)}>
                                            <span className="col-icon">✍️</span>
                                            <h4>Writing</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            <div className="reading-mega-group writing-group" onClick={() => navigateToCategory('Writing', 'Task 1: Academic')}>
                                                <div className="group-header">
                                                    <h5>Task 1: Academic</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group writing-group" onClick={() => navigateToCategory('Writing', 'Task 1: General')}>
                                                <div className="group-header">
                                                    <h5>Task 1: General</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group writing-group" onClick={() => navigateToCategory('Writing', 'Task 2: Essay')}>
                                                <div className="group-header">
                                                    <h5>Task 2: Essay</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col reading">
                                        <div className="col-header" onClick={() => navigateToCategory('Reading', null)}>
                                            <span className="col-icon">📖</span>
                                            <h4>Reading</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            <div className="reading-mega-group" onClick={() => navigateToCategory('Reading', 'Multiple Choice')}>
                                                <div className="group-header">
                                                    <h5>Multiple Choice</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group" onClick={() => navigateToCategory('Reading', 'True/False Assessment')}>
                                                <div className="group-header">
                                                    <h5>True/False Assessment</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group" onClick={() => navigateToCategory('Reading', 'Matching Tasks')}>
                                                <div className="group-header">
                                                    <h5>Matching Tasks</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group" onClick={() => navigateToCategory('Reading', 'Completion Tasks')}>
                                                <div className="group-header">
                                                    <h5>Completion Tasks</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group" onClick={() => navigateToCategory('Reading', 'Short Answers')}>
                                                <div className="group-header">
                                                    <h5>Short Answers</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mega-col listening">
                                        <div className="col-header" onClick={() => navigateToCategory('Listening', null)}>
                                            <span className="col-icon">🎧</span>
                                            <h4>Listening</h4>
                                        </div>
                                        <div className="reading-mega-groups">
                                            <div className="reading-mega-group listening-group" onClick={() => navigateToCategory('Listening', 'Section 1: Conversation')}>
                                                <div className="group-header">
                                                    <h5>Section 1: Conversation</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group listening-group" onClick={() => navigateToCategory('Listening', 'Section 2: Monologue')}>
                                                <div className="group-header">
                                                    <h5>Section 2: Monologue</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group listening-group" onClick={() => navigateToCategory('Listening', 'Section 3: Discussion')}>
                                                <div className="group-header">
                                                    <h5>Section 3: Discussion</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group listening-group" onClick={() => navigateToCategory('Listening', 'Section 4: Lecture')}>
                                                <div className="group-header">
                                                    <h5>Section 4: Lecture</h5>
                                                </div>
                                            </div>
                                            <div className="reading-mega-group listening-group" onClick={() => navigateToCategory('Listening', 'Multiple Choice')}>
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
                        <Link to="/dashboard">Hiate</Link>
                        <Link to="/pricing">Buy</Link>
                        <Link to="/practice" className="nav-link">Library</Link>
                        <Link to="/dashboard">Resources</Link>
                        <Link to="/admin" className="nav-admin-btn">Admin Panel</Link>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-search">
                        <input type="text" placeholder="Search resources..." />
                        <span>🔍</span>
                    </div>


                    <button onClick={onToggleTheme} className="theme-toggle">
                        {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div className="nav-account" onClick={handleSignOut}>
                        <img
                            src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || rahulProfile}
                            alt="Profile"
                            className="nav-acc-img"
                            referrerPolicy="no-referrer"
                        />
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
                        { num: '1470', label: 'Prediction Questions', color: '#EF4444', percent: '0%', drill: 'Predictions' },
                        { num: '8817', label: 'Speaking Questions', color: '#F97316', percent: '0%', drill: 'Speaking' },
                        { num: '891', label: 'Writing Questions', color: '#3B82F6', percent: '0%', drill: 'Writing' },
                        { num: '0', label: 'Reading Questions', color: '#10B981', percent: '0%', drill: 'Reading' },
                        { num: '5898', label: 'Listening Questions', color: '#1E40AF', percent: '0%', drill: 'Listening' }
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`analytics-stat-card ${stat.drill ? 'clickable-stat' : ''}`}
                            onClick={() => stat.drill && setActiveDrillDown(stat.drill)}
                            style={{ cursor: stat.drill ? 'pointer' : 'default' }}
                        >
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
                                                items: [{ l: 'Single Answer', v: '0/250' }, { l: 'Multiple Answer', v: '0/180' }]
                                            },
                                            {
                                                group: 'True/False',
                                                items: [{ l: 'True/False/NG', v: '0/300' }, { l: 'Yes/No/NG', v: '0/280' }]
                                            },
                                            {
                                                group: 'Matching',
                                                items: [{ l: 'Headings', v: '0/210' }, { l: 'Information', v: '0/190' }]
                                            },
                                            {
                                                group: 'Completion',
                                                items: [{ l: 'Sentence', v: '0/220' }, { l: 'Summary', v: '0/240' }]
                                            }
                                        ].map((grp, i) => (
                                            <div key={i} className="reading-group-block">
                                                <div className="r-group-header">
                                                    <h5 className="r-group-title">{grp.group}</h5>
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
                                            { l: 'Fill in the Blanks', v: '0/417' },
                                            { l: 'Multiple Choice Qs', v: '0/400' },
                                            { l: 'Highlight Incorrect', v: '0/513' },
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
                                            <circle cx="100" cy="100" r="1.5" fill="#10B981" />
                                        </svg>
                                    </div>
                                    <div className="chart-x-axis">
                                        {['21 Dec', '22 Dec', '23 Dec', '24 Dec', '25 Dec', '26 Dec', '27 Dec'].map(date => (
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


                    <div className="module-grid">
                        {[
                            { title: 'Templates', icon: '📝', color: '#10B981' },
                            { title: 'Predictions', icon: '📹', color: '#06B6D4' },
                            { title: 'Strategy Videos', icon: '💻', color: '#2DD4BF' },
                            { title: 'Vocab Bank', icon: '📕', color: '#EF4444', badge: '!', link: '/vocab' },
                            { title: 'Score Feedback', icon: '📊', color: '#1E40AF', badge: 'i' },
                            { title: 'Compatibility', icon: '💻', color: '#F59E0B', badge: 'i' },
                            { title: 'Mock Tests', icon: '📒', color: '#A855F7' },
                            { title: 'MT Scores', icon: '📋', color: '#0EA5E9' }
                        ].map((mod, idx) => (
                            <div
                                key={idx}
                                className="module-card"
                                onClick={() => mod.link && navigate(mod.link)}
                                style={{ cursor: mod.link ? 'pointer' : 'default' }}
                            >
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
                                <span onClick={() => changeMonth(-1)}>❮</span>
                                <strong>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</strong>
                                <span onClick={() => changeMonth(1)}>❯</span>
                            </div>
                        </div>
                        <div className="cal-grid">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={`${d}-${i}`} className="cal-day-name">{d}</span>)}
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
                            <span className="soc-yt">YT</span>
                        </div>
                    </div>

                    <div className="referral-card">
                        <div className="ref-header">
                            <h3>Refer & Friend</h3>
                        </div>
                        <div className="ref-content">
                            <div className="ref-icon">🎁</div>
                            <div className="ref-text">
                                <strong>Gift 10% Off</strong>
                                <p>On their first subscription purchase</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Drill Down Overlay */}
            {activeDrillDown && (
                <div className="drill-down-overlay" onClick={() => setActiveDrillDown(null)} data-skill={activeDrillDown.toLowerCase()}>
                    <div className="drill-down-content premium-glass" onClick={(e) => e.stopPropagation()}>
                        <div className="drill-down-header">
                            <div className="header-skill-info">
                                <span className="skill-icon-large">
                                    {activeDrillDown === 'Reading' && '📖'}
                                    {activeDrillDown === 'Listening' && '🎧'}
                                    {activeDrillDown === 'Speaking' && '🎙️'}
                                    {activeDrillDown === 'Writing' && '✍️'}
                                    {activeDrillDown === 'Predictions' && '🔮'}
                                </span>
                                <div>
                                    <h2>{activeDrillDown} Question Bank</h2>
                                    <p className="drill-subtitle">Curated excellence for your band 8.0 target</p>
                                </div>
                            </div>
                            <button className="close-drill-btn" onClick={() => setActiveDrillDown(null)}>✕</button>
                        </div>

                        <div className="drill-stats-bar">
                            <div className="drill-stat-item">
                                <span className="label">Complexity</span>
                                <span className="value">Mixed</span>
                            </div>
                            <div className="drill-stat-item">
                                <span className="label">Total Assets</span>
                                <span className="value">3.2k+</span>
                            </div>
                            <div className="drill-stat-item">
                                <span className="label">Est. Time</span>
                                <span className="value">15m / unit</span>
                            </div>
                        </div>

                        <div className="question-bank-list custom-scrollbar">
                            {(activeDrillDown === 'Reading' ? [
                                { id: '#RD12001', title: 'Insects and Biodiversity', diff: 'Medium', type: 'True/False', icon: '🦋' },
                                { id: '#RD12002', title: 'The Future of Workforce', diff: 'Hard', type: 'Completion', icon: '💼' },
                                { id: '#RD12003', title: 'Quantum Computing Potential', diff: 'Hard', type: 'MCQ', icon: '⚛️' },
                                { id: '#RD12004', title: 'Evolution of Urban Cities', diff: 'Medium', type: 'Matching', icon: '🏢' },
                                { id: '#RD12005', title: 'Oceanic Ecosystems', diff: 'Medium', type: 'Short Answer', icon: '🌊' },
                            ] : activeDrillDown === 'Listening' ? [
                                { id: '#LS09001', title: 'Campus Orientation Talk', diff: 'Medium', type: 'Multiple Choice', icon: '🏫' },
                                { id: '#LS09002', title: 'Natural History Podcast', diff: 'Hard', type: 'Gap Fill', icon: '🦖' },
                                { id: '#LS09003', title: 'Business Project Brief', diff: 'Medium', type: 'Short Question', icon: '📊' },
                            ] : activeDrillDown === 'Speaking' ? [
                                { id: '#SP04001', title: 'Describe a historical place', diff: 'Hard', type: 'Part 2 Cue Card', icon: '🏰' },
                                { id: '#SP04002', title: 'Family and Friends Discussion', diff: 'Medium', type: 'Part 1 Intro', icon: '👨‍👩‍👧‍👦' },
                            ] : activeDrillDown === 'Writing' ? [
                                { id: '#WR08001', title: 'Climate Change Solutions', diff: 'Hard', type: 'Task 2 Essay', icon: '🔥' },
                                { id: '#WR08002', title: 'Global Population Trends', diff: 'Medium', type: 'Task 1 Graph', icon: '📈' },
                            ] : [
                                { id: '#PR01001', title: 'Upcoming Exam Predictions', diff: 'Hard', type: 'Prediction', icon: '🔮' },
                                { id: '#PR01002', title: 'Monthly Strategy Guide', diff: 'Medium', type: 'Strategy', icon: '🎯' },
                            ]).map((q, idx) => (
                                <div
                                    key={q.id}
                                    className="question-bank-item float-item"
                                    style={{ animationDelay: `${idx * 0.15}s` }}
                                    onClick={() => navigate(`/practice/${q.id}`)}
                                >
                                    <div className="q-icon-wrapper-neon">{q.icon}</div>
                                    <div className="q-info">
                                        <div className="q-title-premium">{q.title}</div>
                                        <div className="q-meta-glow">
                                            <span className="q-id-tag">{q.id}</span>
                                            <span className="dot-sep">•</span>
                                            <span className="q-type-label">{q.type}</span>
                                        </div>
                                    </div>
                                    <div className="q-action-group">
                                        <div className={`difficulty-badge-neon ${q.diff.toLowerCase()}`}>
                                            {q.diff}
                                        </div>
                                        <button className="q-preview-btn">Start →</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="drill-down-footer">
                            <span className="footer-hint">💡 Pro Hint: Consistent practice improves performance by 40%</span>
                            <button className="start-practice-btn-glow" onClick={() => navigate('/practice')}>
                                Explore Full Library
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isScoreModalOpen && <ScoreTargetModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} currentTheme={currentTheme} />}
            {isCountdownModalOpen && (
                <ExamCountdownModal
                    isOpen={isCountdownModalOpen}
                    onClose={() => setIsCountdownModalOpen(false)}
                    onSave={handleSaveExamDate}
                    initialDate={targetExamDate}
                />
            )}
        </div>
    );
};

export default Dashboard;

import React from 'react';

const AdminHeader = ({ title, user, currentTheme, onToggleTheme }) => {
    return (
        <header className="admin-header-bar">
            <div className="header-left">
                <h2 className="page-title">{title}</h2>
                <div className="breadcrumbs">
                    <span>Admin</span>
                    <span className="separator">/</span>
                    <span className="current">{title}</span>
                </div>
            </div>

            <div className="header-right">
                <div className="search-bar-mini">
                    <span className="icon">🔍</span>
                    <input type="text" placeholder="Search..." />
                </div>

                <button
                    className="theme-toggle-btn"
                    onClick={onToggleTheme}
                    title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-main)',
                        borderRadius: '10px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: 'var(--text-main)',
                        transition: 'all 0.3s'
                    }}
                >
                    {currentTheme === 'dark' ? '☀️' : '🌙'}
                </button>

                <button className="icon-btn-header">🔔</button>
                <button className="icon-btn-header">⚙️</button>
            </div>
        </header>
    );
};

export default AdminHeader;

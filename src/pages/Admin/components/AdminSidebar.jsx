import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../AdminPanel.css'; // Use shared styles

const AdminSidebar = ({ activeView, onNavigate }) => {
    const navigate = useNavigate();

    const [expanded, setExpanded] = React.useState({ questions: false });

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        {
            id: 'questions',
            label: 'Question Bank',
            icon: '❓',
            hasSubItems: true,
            subItems: [
                { label: 'Reading', section: 'Reading', icon: '📖' },
                { label: 'Listening', section: 'Listening', icon: '🎧' },
                { label: 'Writing', section: 'Writing', icon: '✍️' },
                { label: 'Speaking', section: 'Speaking', icon: '🗣️' }
            ]
        },
        { id: 'passages', label: 'Reading Passages', icon: '📑' },
        { id: 'exam-maker', label: 'Exam Paper Maker', icon: '📝' },
        { id: 'ai-generator', label: 'AI Generator', icon: '🤖' },
        { id: 'ai-classifier', label: 'AI Classifier', icon: '🧠', action: () => navigate('/ai-classifier') },
        { id: 'recycle-bin', label: 'Recycle Bin', icon: '🗑️' },
    ];

    const bottomItems = [
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'logout', label: 'Log Out', icon: '🚪' }
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-brand">
                <div className="brand-logo">🛡️</div>
                <div className="brand-text">
                    <h3>Admin Portal</h3>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group-label">MAIN MENU</div>
                {menuItems.map(item => (
                    <div key={item.id} className="nav-item-wrapper">
                        <button
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => {
                                if (item.hasSubItems) {
                                    toggleExpand(item.id);
                                    // Optionally navigate to main questions view too, or just toggle
                                    // onNavigate(item.id); 
                                } else {
                                    item.action ? item.action() : onNavigate(item.id);
                                }
                            }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {item.hasSubItems && (
                                <span className="arrow" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                                    {expanded[item.id] ? '▲' : '▼'}
                                </span>
                            )}
                        </button>

                        {/* Sub Items Render */}
                        {item.hasSubItems && expanded[item.id] && (
                            <div className="nav-sub-items" style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.5rem' }}>
                                {item.subItems.map(sub => (
                                    <button
                                        key={sub.section}
                                        className={`nav-sub-item ${activeView === 'questions' && 'todo-check-section' ? '' : ''}`} // Logic could be added here if we passed currentSection prop
                                        onClick={() => onNavigate('questions', { section: sub.section })}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            padding: '0.5rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.85rem'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#fff'}
                                        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                                    >
                                        <span>{sub.icon}</span>
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                <div className="nav-group-label" style={{ marginTop: '1.5rem' }}>SYSTEM</div>
                {bottomItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => item.id === 'logout' ? onNavigate('logout') : onNavigate(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="admin-profile-mini">
                    <div className="avatar">A</div>
                    <div className="info">
                        <p className="name">Admin User</p>
                        <p className="role">Administrator</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;

import React from 'react';

const DashboardOverview = ({ stats = {} }) => {
    return (
        <div className="dashboard-overview">
            <div className="stats-grid">
                <div className="stat-card premium-glass">
                    <div className="icon-wrapper blue">👥</div>
                    <div className="stat-info">
                        <span className="label">Total Users</span>
                        <h3 className="value">1,240</h3>
                        <span className="trend positive">↑ 12% this week</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <div className="icon-wrapper green">❓</div>
                    <div className="stat-info">
                        <span className="label">Total Questions</span>
                        <h3 className="value">856</h3>
                        <span className="trend positive">↑ 5% this week</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <div className="icon-wrapper purple">📖</div>
                    <div className="stat-info">
                        <span className="label">Reading Passages</span>
                        <h3 className="value">142</h3>
                        <span className="trend neutral">0% this week</span>
                    </div>
                </div>
                <div className="stat-card premium-glass">
                    <div className="icon-wrapper orange">📝</div>
                    <div className="stat-info">
                        <span className="label">Tests Taken</span>
                        <h3 className="value">3,502</h3>
                        <span className="trend positive">↑ 18% this week</span>
                    </div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card premium-glass wide">
                    <h3>Activity Overview</h3>
                    <div className="placeholder-chart">
                        {/* Placeholder for a chart */}
                        <div className="bar" style={{ height: '60%' }}></div>
                        <div className="bar" style={{ height: '80%' }}></div>
                        <div className="bar" style={{ height: '40%' }}></div>
                        <div className="bar" style={{ height: '90%' }}></div>
                        <div className="bar" style={{ height: '70%' }}></div>
                        <div className="bar" style={{ height: '50%' }}></div>
                        <div className="bar" style={{ height: '75%' }}></div>
                    </div>
                </div>
                <div className="chart-card premium-glass">
                    <h3>Recent Actions</h3>
                    <ul className="activity-list">
                        <li>
                            <span className="dot blue"></span>
                            <span>New question added to <strong>Reading</strong></span>
                            <span className="time">2m ago</span>
                        </li>
                        <li>
                            <span className="dot green"></span>
                            <span>User <strong>JohnDoe</strong> registered</span>
                            <span className="time">15m ago</span>
                        </li>
                        <li>
                            <span className="dot orange"></span>
                            <span>Server backup completed</span>
                            <span className="time">1h ago</span>
                        </li>
                        <li>
                            <span className="dot red"></span>
                            <span>Failed login attempt</span>
                            <span className="time">3h ago</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;

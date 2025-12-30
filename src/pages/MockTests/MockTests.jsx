import React from 'react';
import './MockTests.css';

const MockTests = () => {
    const tests = [
        { id: 'listening', name: 'Listening', icon: '🎧' },
        { id: 'reading', name: 'Reading', icon: '📖' },
        { id: 'writing', name: 'Writing', icon: '✍️' },
        { id: 'speaking', name: 'Speaking', icon: '🎤' }
    ];

    return (
        <div className="mock-tests-page page-container">
            <h1>Mock Tests</h1>
            <div className="tests-grid">
                {tests.map(test => (
                    <div key={test.id} className="test-card">
                        <span className="test-icon">{test.icon}</span>
                        <h3>{test.name}</h3>
                        <button className="btn-primary-red">Start Test</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MockTests;

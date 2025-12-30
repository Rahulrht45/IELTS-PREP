import React from 'react';
import './HelpCenter.css';

const HelpCenter = () => {
    return (
        <div className="help-center-page page-container">
            <h1>Help Center</h1>
            <div className="faq-list">
                <details className="faq-item">
                    <summary>How can I reset my password?</summary>
                    <p>Go to login page and click "Forgot Password".</p>
                </details>
                <details className="faq-item">
                    <summary>Is there an app?</summary>
                    <p>Coming soon to iOS and Android!</p>
                </details>
            </div>
        </div>
    );
};

export default HelpCenter;

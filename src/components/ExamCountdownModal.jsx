import React, { useState, useEffect } from 'react';
import './ExamCountdownModal.css';

const ExamCountdownModal = ({ isOpen, onClose, onSave, currentDate }) => {
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (currentDate) {
            // Format date to YYYY-MM-DD for input
            const date = new Date(currentDate);
            const formatted = date.toISOString().split('T')[0];
            setSelectedDate(formatted);
        }
    }, [currentDate, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!selectedDate) return;
        onSave(new Date(selectedDate));
        onClose();
    };

    return (
        <div className="countdown-modal-overlay" onClick={onClose}>
            <div className="countdown-modal-content" onClick={e => e.stopPropagation()}>
                <div className="countdown-modal-header">
                    <h2>Set Exam Date</h2>
                </div>
                <div className="countdown-modal-body">
                    <p>Select the date of your upcoming IELTS exam to start the countdown.</p>
                    <div className="countdown-input-group">
                        <label htmlFor="exam-date">Exam Date</label>
                        <input
                            type="date"
                            id="exam-date"
                            className="countdown-date-input"
                            value={selectedDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="countdown-modal-footer">
                        <button className="btn-countdown-cancel" onClick={onClose}>Cancel</button>
                        <button className="btn-countdown-save" onClick={handleSave}>Save Date</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamCountdownModal;

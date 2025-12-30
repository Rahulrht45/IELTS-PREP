import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VocabBank.css';

const VocabBank = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Mock Data for now
    const [vocabList] = useState([
        { id: 1, word: 'Alleviate', type: 'Verb', definition: 'To make something less severe.', example: 'The government implemented new policies to alleviate poverty.', category: 'Academic' },
        { id: 2, word: 'Detrimental', type: 'Adjective', definition: 'Tending to cause harm.', example: 'Smoking has a detrimental effect on health.', category: 'Health' },
        { id: 3, word: 'Mitigate', type: 'Verb', definition: 'To make less severe, serious, or painful.', example: 'Trees help to mitigate the effects of climate change.', category: 'Environment' },
        { id: 4, word: 'Ubiquitous', type: 'Adjective', definition: 'Present, appearing, or found everywhere.', example: 'Smartphones have become ubiquitous in modern society.', category: 'Technology' },
        { id: 5, word: 'Pragmatic', type: 'Adjective', definition: 'Dealing with things sensibly and realistically.', example: 'We need a pragmatic approach to solve this complex issue.', category: 'Work' },
    ]);

    const categories = ['All', 'Academic', 'Environment', 'Health', 'Technology', 'Work'];

    const filteredVocab = vocabList.filter(item => {
        const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleSpeak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'en-GB';
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };

    return (
        <div className="vocab-container">
            <div className="vocab-header-section">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Dashboard
                </button>
                <h1>📘 IELTS Vocabulary Bank</h1>
                <p>Master high-band vocabulary for Speaking & Writing.</p>
            </div>

            <div className="vocab-controls premium-glass">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for a word..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="category-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="vocab-grid">
                {filteredVocab.map(item => (
                    <div key={item.id} className="vocab-card premium-glass">
                        <div className="card-header">
                            <h2>{item.word}</h2>
                            <span className="word-type">{item.type}</span>
                            <button className="speak-btn" onClick={() => handleSpeak(item.word)}>🔊</button>
                        </div>
                        <div className="card-body">
                            <div className="definition">
                                <strong>Definition:</strong>
                                <p>{item.definition}</p>
                            </div>
                            <div className="example">
                                <strong>Example:</strong>
                                <p>"{item.example}"</p>
                            </div>
                        </div>
                        <div className="card-footer">
                            <span className="category-tag">#{item.category}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VocabBank;

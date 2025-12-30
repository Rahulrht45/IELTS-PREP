import React from 'react';
import '../index.css';
import './LeaderboardSection.css'; // Premium Styles
import rahulImg from '../assets/images/rahul.png';
import munnaImg from '../assets/images/munna.png';
import rumiImg from '../assets/images/rumi.png';

const LeaderboardSection = () => {
    return (
        <section className="leaderboard-section">
            <div className="section-header">
                <h2 className="section-title">Top Performers</h2>
                <p className="section-subtitle">See who's leading the charts this week</p>
            </div>

            <div className="leaderboard-grid">
                {/* 2nd Place */}
                <div className="leader-card card-second">
                    <div className="medal-icon">🥈</div>
                    <div className="avatar-circle">
                        <img src={munnaImg} alt="Munna" className="avatar-img" />
                    </div>
                    <h3 className="user-name">Munna</h3>
                    <span className="band-badge badge-gray">Band 7.5</span>
                </div>

                {/* 1st Place */}
                <div className="leader-card card-first">
                    <div className="medal-icon large">🥇</div>
                    <div className="avatar-circle">
                        <img src={rahulImg} alt="Rahul" className="avatar-img" />
                    </div>
                    <h3 className="user-name bold">Rahul</h3>
                    <span className="band-badge badge-yellow">Band 8.5</span>
                    <div className="shine-effect"></div>
                </div>

                {/* 3rd Place */}
                <div className="leader-card card-third">
                    <div className="medal-icon">🥉</div>
                    <div className="avatar-circle">
                        <img src={rumiImg} alt="Rumi" className="avatar-img" />
                    </div>
                    <h3 className="user-name">Rumi</h3>
                    <span className="band-badge badge-orange">Band 7.5</span>
                </div>
            </div>
        </section>
    );
};

export default LeaderboardSection;


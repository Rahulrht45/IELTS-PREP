import React from 'react';
import HeroSection from '../../components/HeroSection';
import LeaderboardSection from '../../components/LeaderboardSection';
import FeaturesSection from '../../components/FeaturesSection';
import ExamSimulationSection from '../../components/ExamSimulationSection';
import LiveSpeakingSection from '../../components/LiveSpeakingSection';
import './Home.css';

const Home = ({ onRegisterClick }) => {
    return (
        <div className="home-page">
            <HeroSection onStartNowClick={onRegisterClick} />
            <LeaderboardSection />
            <FeaturesSection />
            <ExamSimulationSection />
            <LiveSpeakingSection />
        </div>
    );
};

export default Home;

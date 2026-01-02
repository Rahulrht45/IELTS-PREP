import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './index.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

// Modular Pages
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import MockTests from './pages/MockTests/MockTests';
import HelpCenter from './pages/HelpCenter/HelpCenter';
import Contact from './pages/Contact/Contact';
import Pricing from './pages/Pricing/Pricing';
import Practice from './pages/Practice/Practice';
import PracticeTest from './pages/Practice/PracticeTest';
import ReadingTest from './pages/Practice/ReadingTest';
import VocabBank from './pages/Vocab/VocabBank';


import Dashboard from './pages/Dashboard/Dashboard';
import AiClassifier from './components/AiClassifier';
import { supabase } from './config/supabaseClient';
import SupabaseExample from './components/SupabaseExample';
import AdminPanel from './pages/Admin/AdminPanel';
import QuestionBuilderPage from './pages/Admin/QuestionBuilderPage';
import PassageBuilderPage from './pages/Admin/PassageBuilderPage';
import ExamPreviewPage from './pages/Admin/ExamPreviewPage';

function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])


  if (session) {
    return (
      <div className="App">
        <Routes>
          <Route path="/" element={
            <Dashboard
              user={session.user}
              onSignOut={() => setSession(null)}
              currentTheme={theme}
              onToggleTheme={toggleTheme}
            />
          } />
          <Route path="/dashboard" element={
            <Dashboard
              user={session.user}
              onSignOut={() => setSession(null)}
              currentTheme={theme}
              onToggleTheme={toggleTheme}
            />
          } />
          <Route path="/pricing" element={
            <Pricing
              currentTheme={theme}
              onToggleTheme={toggleTheme}
              onBackToDashboard={() => navigate('/dashboard')}
            />
          } />
          <Route path="/admin" element={<AdminPanel currentTheme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/admin/builder" element={<QuestionBuilderPage currentTheme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/admin/passage-builder" element={<PassageBuilderPage currentTheme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/admin/exam-preview/:passageId" element={<ExamPreviewPage currentTheme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/supabase-test" element={<SupabaseExample />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:id" element={<PracticeTest />} />
          <Route path="/reading-test/:id" element={<ReadingTest />} />
          <Route path="/ai-classifier" element={<AiClassifier />} />
          <Route path="/vocab" element={<VocabBank />} />
        </Routes>
      </div>
    )
  }

  // Back button component
  const BackButton = ({ onClick, color = '#64748B' }) => (
    <button
      onClick={onClick}
      className="back-btn"
      style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px', zIndex: 50, color: color }}
    >
      ← Back to Home
    </button>
  );

  if (showLogin) {
    return (
      <div className="App">
        <BackButton onClick={() => setShowLogin(false)} />
        <LoginPage
          onLoginSuccess={() => setShowLogin(false)}
          onSignUpClick={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      </div>
    )
  }

  if (showRegister) {
    return (
      <div className="App">
        <BackButton onClick={() => setShowRegister(false)} color="white" />
        <RegisterPage onSignInClick={() => {
          setShowRegister(false);
          setShowLogin(true);
        }} />
      </div>
    )
  }

  return (
    <div className="App">
      <Header
        onSignInClick={() => setShowLogin(true)}
        onGetStartedClick={() => setShowRegister(true)}
        currentTheme={theme}
        onToggleTheme={toggleTheme}
      />

      <main>
        <Routes>
          <Route path="/" element={<Home onRegisterClick={() => setShowRegister(true)} />} />
          <Route path="/about" element={<About />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/mock-tests" element={<MockTests />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing currentTheme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/admin/exam-preview/:passageId" element={<ExamPreviewPage currentTheme={theme} onToggleTheme={toggleTheme} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;

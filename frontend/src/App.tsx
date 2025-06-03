import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateChallenge } from './pages/CreateChallenge';
import { ThreadView } from './pages/ThreadView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/create-challenge" element={<CreateChallenge />} />
          <Route path="/thread/:threadId" element={<ThreadView />} />
          <Route path="/categories" element={<div className="p-8 text-center">Categories Page Coming Soon</div>} />
          <Route path="/categories/:categoryId" element={<div className="p-8 text-center">Category Detail Page Coming Soon</div>} />
          <Route path="/leaderboard" element={<div className="p-8 text-center">Leaderboard Page Coming Soon</div>} />
          <Route path="/bounties" element={<div className="p-8 text-center">Bounties Page Coming Soon</div>} />
          <Route path="/profile" element={<div className="p-8 text-center">Profile Page Coming Soon</div>} />
          <Route path="/settings" element={<div className="p-8 text-center">Settings Page Coming Soon</div>} />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

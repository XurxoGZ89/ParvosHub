import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './components/Home';
import ExpenseTracker from './components/ExpenseTracker';
import ResumenAnual from './components/ResumenAnual';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Routes>
        <Route path="/" element={<Home onNavigate={(page) => navigate(`/${page}`)} />} />
        <Route path="/gastos" element={<ExpenseTracker onBack={() => navigate('/')} />} />
        <Route path="/resumen" element={<ResumenAnual onBack={() => navigate('/')} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
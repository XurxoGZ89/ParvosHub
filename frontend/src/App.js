import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CalendarEventsProvider } from './contexts/CalendarEventsContext';
import Home from './components/Home';
import ExpenseTracker from './components/ExpenseTracker';
import ResumenAnual from './components/ResumenAnual';
import Calendario from './components/Calendario';
import CalendarioComidas from './components/CalendarioComidas';
import CalendarioComidasV2 from './components/CalendarioComidasV2';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Routes>
        <Route path="/" element={<Home onNavigate={(page, params) => navigate(`/${page}`, { state: params })} />} />
        <Route path="/gastos" element={<ExpenseTracker onBack={() => navigate('/')} />} />
        <Route path="/resumen" element={<ResumenAnual onBack={() => navigate('/')} />} />
        <Route path="/calendario" element={<Calendario onBack={() => navigate('/')} />} />
        <Route path="/calendariocomidas" element={<CalendarioComidas onBack={() => navigate('/')} />} />
        <Route path="/calendariocomidasv2" element={<CalendarioComidasV2 onBack={() => navigate('/')} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CalendarEventsProvider>
        <Router>
          <AppContent />
        </Router>
      </CalendarEventsProvider>
    </LanguageProvider>
  );
}

export default App;
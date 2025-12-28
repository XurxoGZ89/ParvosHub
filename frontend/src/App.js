import React, { useState } from 'react';
import Home from './components/Home';
import ExpenseTracker from './components/ExpenseTracker';
import ResumenAnual from './components/ResumenAnual';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ margin: 0, padding: 0 }}>
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'gastos' && <ExpenseTracker onBack={() => handleNavigate('home')} />}
      {currentPage === 'resumen' && <ResumenAnual onBack={() => handleNavigate('home')} />}
    </div>
  );
}

export default App;
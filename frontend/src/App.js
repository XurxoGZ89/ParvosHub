import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CalendarEventsProvider } from './contexts/CalendarEventsContext';

// Auth Components
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Home from './components/Home';
import ParvosAccount from './components/parvos/ParvosAccountV3';
import ResumenAnual from './components/ResumenAnual';
import Calendario from './components/Calendario';
import CalendarioComidasV2 from './components/CalendarioComidasV2';

import './App.css';

function App() {
  return (
    <LanguageProvider>
      <CalendarEventsProvider>
        <Router>
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas con layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="user-account" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold">Mi Cuenta - En desarrollo</h2></div>} />
              <Route path="gastos" element={<ParvosAccount />} />
              <Route path="user-summary" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold">Resumen Anual Usuario - En desarrollo</h2></div>} />
              <Route path="resumen" element={<ResumenAnual />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="calendariocomidasv2" element={<CalendarioComidasV2 />} />
            </Route>

            {/* Redirigir rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CalendarEventsProvider>
    </LanguageProvider>
  );
}

export default App;
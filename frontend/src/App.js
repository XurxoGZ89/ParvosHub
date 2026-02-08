import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CalendarEventsProvider } from './contexts/CalendarEventsContext';

// Auth Components
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ScrollToTop from './components/ScrollToTop';

// Desktop Pages
import Home from './components/Home';
import UserAccount from './components/user/UserAccount';
import ParvosAccount from './components/parvos/ParvosAccountV3';
import ResumenAnual from './components/parvos/ResumenAnual';
import ExpensesCalendar from './components/calendar/ExpensesCalendar';
import MealsCalendar from './components/calendar/MealsCalendar';

// Mobile Components
import useDeviceType from './hooks/useDeviceType';
import MobileLayout from './components/layout/MobileLayout';
import MobileHome from './components/mobile/MobileHome';
import MobilePersonalAccount from './components/mobile/MobilePersonalAccount';
import MobileFamilyAccount from './components/mobile/MobileFamilyAccount';
import MobileExpensesCalendar from './components/mobile/MobileExpensesCalendar';
import MobileMealsCalendar from './components/mobile/MobileMealsCalendar';
import MobileMoreMenu from './components/mobile/MobileMoreMenu';

import './App.css';

function AppRoutes() {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <Routes>
        {/* Login (compartido) */}
        <Route path="/login" element={<Login />} />

        {/* Rutas móviles protegidas */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MobileLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MobileHome />} />
          <Route path="user-account" element={<MobilePersonalAccount />} />
          <Route path="gastos" element={<MobileFamilyAccount />} />
          <Route path="calendario-gastos" element={<MobileExpensesCalendar />} />
          <Route path="calendario-comidas" element={<MobileMealsCalendar />} />
          <Route path="resumen" element={<ResumenAnual />} />
          <Route path="mas" element={<MobileMoreMenu />} />
          {/* Rutas antiguas redirigen */}
          <Route path="calendario" element={<Navigate to="/calendario-gastos" replace />} />
          <Route path="calendariocomidasv2" element={<Navigate to="/calendario-comidas" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas con layout desktop */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="user-account" element={<UserAccount />} />
        <Route path="gastos" element={<ParvosAccount />} />
        <Route path="user-summary" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold">Resumen Anual Usuario - En desarrollo</h2></div>} />
        <Route path="resumen" element={<ResumenAnual />} />
        <Route path="calendario-gastos" element={<ExpensesCalendar />} />
        <Route path="calendario-comidas" element={<MealsCalendar />} />
        {/* Rutas antiguas redirigen a las nuevas */}
        <Route path="calendario" element={<Navigate to="/calendario-gastos" replace />} />
        <Route path="calendariocomidasv2" element={<Navigate to="/calendario-comidas" replace />} />
      </Route>

      {/* Redirigir rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CalendarEventsProvider>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </CalendarEventsProvider>
    </LanguageProvider>
  );
}

export default App;
import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  ca: {
    'parvosHub': 'Parvos Hub',
    'homeSubtitle': 'Control intel·ligent de despeses familiars',
    'volver': 'Tornar',
    'categoria': 'Categoria',
    'cantidad': 'Quantitat',
    'enero': 'Gener',
    'febrero': 'Febrer',
    'marzo': 'Març',
    'abril': 'Abril',
    'mayo': 'Maig',
    'junio': 'Juny',
    'julio': 'Juliol',
    'agosto': 'Agost',
    'septiembre': 'Setembre',
    'octubre': 'Octubre',
    'noviembre': 'Novembre',
    'diciembre': 'Desembre',
    'fecha': 'Data',
    'tipo': 'Tipus',
    'descripcion': 'Descripció',
    'usuario': 'Usuari',
    'cuenta': 'Compte',
    'anadir': 'Afegir',
    'guardarCambios': 'Guardar canvis',
    'cancelar': 'Cancel·lar',
    'ingresos': 'Ingressos',
    'gastos': 'Despeses',
    'saldoActual': 'Saldo actual',
    'editar': 'Editar',
    'guardar': 'Guardar',
    'borrar': 'Borrar',
    'anterior': 'Anterior',
    'siguiente': 'Següent',
    'salir': 'Sortir',
    'miCuenta': 'La meva compte',
    'cuentaParvos': 'Compte Parvos',
    'resumenAnual': 'Resum Anual',
    'calendario': 'Calendari',
    'resumen': 'Resum',
    'presupuestos': 'Pressupostos',
    'registro': 'Registre',
  },
  gl: {
    'parvosHub': 'Parvos Hub',
    'homeSubtitle': 'Control intelixente de gastos familiares',
    'volver': 'Volver',
    'categoria': 'Categoría',
    'cantidad': 'Cantidade',
    'enero': 'Xaneiro',
    'febrero': 'Febreiro',
    'marzo': 'Marzo',
    'abril': 'Abril',
    'mayo': 'Maio',
    'junio': 'Xuño',
    'julio': 'Xullo',
    'agosto': 'Agosto',
    'septiembre': 'Setembro',
    'octubre': 'Outubro',
    'noviembre': 'Novembro',
    'diciembre': 'Decembro',
    'fecha': 'Data',
    'tipo': 'Tipo',
    'descripcion': 'Descripción',
    'usuario': 'Usuario',
    'cuenta': 'Conta',
    'anadir': 'Engadir',
    'guardarCambios': 'Gardar cambios',
    'cancelar': 'Cancelar',
    'ingresos': 'Ingresos',
    'gastos': 'Gastos',
    'saldoActual': 'Saldo actual',
    'editar': 'Editar',
    'guardar': 'Guardar',
    'borrar': 'Borrar',
    'anterior': 'Anterior',
    'siguiente': 'Seguinte',
    'salir': 'Saír',
    'miCuenta': 'A minha conta',
    'cuentaParvos': 'Conta Parvos',
    'resumenAnual': 'Resumo Anual',
    'calendario': 'Calendario',
    'resumen': 'Resumo',
    'presupuestos': 'Orzamentos',
    'registro': 'Rexistro',
  },
  es: {
    'parvosHub': 'Parvos Hub',
    'homeSubtitle': 'Control inteligente de gastos familiares',
    'volver': 'Volver',
    'categoria': 'Categoría',
    'cantidad': 'Cantidad',
    'enero': 'Enero',
    'febrero': 'Febrero',
    'marzo': 'Marzo',
    'abril': 'Abril',
    'mayo': 'Mayo',
    'junio': 'Junio',
    'julio': 'Julio',
    'agosto': 'Agosto',
    'septiembre': 'Septiembre',
    'octubre': 'Octubre',
    'noviembre': 'Noviembre',
    'diciembre': 'Diciembre',
    'fecha': 'Fecha',
    'tipo': 'Tipo',
    'descripcion': 'Descripción',
    'usuario': 'Usuario',
    'cuenta': 'Cuenta',
    'anadir': 'Añadir',
    'guardarCambios': 'Guardar cambios',
    'cancelar': 'Cancelar',
    'ingresos': 'Ingresos',
    'gastos': 'Gastos',
    'saldoActual': 'Saldo actual',
    'editar': 'Editar',
    'guardar': 'Guardar',
    'borrar': 'Borrar',
    'anterior': 'Anterior',
    'siguiente': 'Siguiente',
    'salir': 'Salir',
    'miCuenta': 'Mi Cuenta',
    'cuentaParvos': 'Cuenta Parvos',
    'resumenAnual': 'Resumen Anual',
    'calendario': 'Calendario',
    'resumen': 'Resumen',
    'presupuestos': 'Presupuestos',
    'registro': 'Registro',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ca');

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe ser usado dentro de LanguageProvider');
  }
  return context;
};

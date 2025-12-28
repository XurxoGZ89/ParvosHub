import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  ca: {
    // Home
    'parvosHub': 'Parvos Hub',
    'homeSubtitle': 'Control intel·ligent de despeses familiars',
    'registro': 'Registre de Despeses',
    'registroDesc': 'Controla i registra totes les despeses',
    'resumen': 'Resum Anual',
    'resumenDesc': 'Anàlisi detallat de despeses',
    'presupuestos': 'Pressupostos',
    'proximamente': 'Pròximament',
    'resumenDelAno': 'Resum de l\'Any',
    'volver': 'Tornar',
    
    // Meses
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
    
    // Categorías
    'vacaciones': 'Vacacions',
    'ocio': 'Oci',
    'hogar': 'Llar',
    'vehiculos': 'Vehicles',
    'extra': 'Extra',
    'alimentacion': 'Alimentació',
    'ingreso': 'Ingreso',
    'gasto': 'Despesa',
    'hucha': 'Estalvi',
    'retiradahucha': 'Retirada Estalvi',
    
    // ExpenseTracker
    'fecha': 'Data',
    'tipo': 'Tipus',
    'cantidad': 'Quantitat',
    'descripcion': 'Descripció o informació (opcional)',
    'categoria': 'Categoria',
    'usuario': 'Usuari',
    'cuenta': 'Compte',
    'anadir': 'Afegir',
    'guardarCambios': 'Guardar canvis',
    'cancelar': 'Cancel·lar',
    'situacionGlobal': '💰 SITUACIÓ GLOBAL',
    'ingresos': 'Ingressos',
    'gastos': 'Despeses',
    'huchaTotal': 'Estalvi Total',
    'saldoActual': 'Saldo actual',
    'movimiento': 'Moviment',
    'editando': '✏️ Editant moviment',
    'seguro': '¿Estàs segur que vols borrar aquest moviment?',
    'borrado': 'Moviment esborrat.',
    'error': 'Error en guardar la operació.',
    'exito': 'Operació afegida correctament.',
    'actualizacion': 'Operació actualitzada correctament.',
    'selectCategoria': 'Selecciona categoria',
    'selectUsuario': 'Selecciona usuari',
    'selectCuenta': 'Selecciona compte',
    'camposObligatorios': 'Per favor, completa tots els camps obligatoris.',
    'errorBorrar': 'Error en borrar el moviment',
    'registroDeGastos': 'Registre de Despeses',
    'noPresupuestosGuardados': 'No hay presupuestos guardados para este mes aún',
    'errorCargarOperaciones': 'Error en cargar operaciones',
    'presupuestosDelMes': 'Pressupostos del Mes',
    'ahorroDelMes': 'Estalvi del Mes',
    'tabla': 'Taula',
    'filtros': 'Filtres',
    'allCategories': 'Totes les categories',
    'allAccounts': 'Tots els comptes',
    'itemsPerPage': 'Elements per pàgina',
  },
  gl: {
    // Home
    'parvosHub': 'Parvos Hub',
    'homeSubtitle': 'Control intelixente de gastos familiares',
    'registro': 'Rexistro de Gastos',
    'registroDesc': 'Controla e registra todos os gastos',
    'resumen': 'Resumo Anual',
    'resumenDesc': 'Análise detallada de gastos',
    'presupuestos': 'Orzamentos',
    'proximamente': 'Proximamente',
    'resumenDelAno': 'Resumo do Ano',
    'volver': 'Volver',
    
    // Meses
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
    
    // Categorías
    'vacaciones': 'Vacacións',
    'ocio': 'Ocio',
    'hogar': 'Fogar',
    'vehiculos': 'Vehículos',
    'extra': 'Extra',
    'alimentacion': 'Alimentación',
    'ingreso': 'Ingreso',
    'gasto': 'Gasto',
    'hucha': 'Aforro',
    'retiradahucha': 'Retirada Aforro',
    
    // ExpenseTracker
    'fecha': 'Data',
    'tipo': 'Tipo',
    'cantidad': 'Cantidade',
    'descripcion': 'Descripción ou información (opcional)',
    'categoria': 'Categoría',
    'usuario': 'Usuario',
    'cuenta': 'Conta',
    'anadir': 'Engadir',
    'guardarCambios': 'Gardar cambios',
    'cancelar': 'Cancelar',
    'situacionGlobal': '💰 SITUACIÓN GLOBAL',
    'ingresos': 'Ingresos',
    'gastos': 'Gastos',
    'huchaTotal': 'Aforro Total',
    'saldoActual': 'Saldo actual',
    'movimiento': 'Movemento',
    'editando': '✏️ Editando movemento',
    'seguro': '¿Estás seguro de que queres borrar este movemento?',
    'borrado': 'Movemento borrado.',
    'error': 'Erro ao gardar a operación.',
    'exito': 'Operación engadida correctamente.',
    'actualizacion': 'Operación actualizada correctamente.',
    'selectCategoria': 'Selecciona categoría',
    'selectUsuario': 'Selecciona usuario',
    'selectCuenta': 'Selecciona conta',
    'camposObligatorios': 'Por favor, completa todos os campos obrigatorios.',
    'errorBorrar': 'Erro ao borrar o movemento',
    'registroDeGastos': 'Rexistro de Gastos',
    'noPresupuestosGuardados': 'No hai orzamentos gardados para este mes aínda',
    'errorCargarOperaciones': 'Erro ao cargar operacións',
    'presupuestosDelMes': 'Orzamentos do Mes',
    'ahorroDelMes': 'Aforro do Mes',
    'tabla': 'Táboa',
    'filtros': 'Filtros',
    'allCategories': 'Todas as categorías',
    'allAccounts': 'Todas as contas',
    'itemsPerPage': 'Elementos por páxina',
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

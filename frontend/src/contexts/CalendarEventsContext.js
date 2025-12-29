import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CalendarEventsContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useCalendarEvents = () => {
  const context = useContext(CalendarEventsContext);
  if (!context) {
    throw new Error('useCalendarEvents debe usarse dentro de CalendarEventsProvider');
  }
  return context;
};

export const CalendarEventsProvider = ({ children }) => {
  const [eventos, setEventos] = useState([]);
  const [dismissedWarnings, setDismissedWarnings] = useState({});
  const [loading, setLoading] = useState(false);

  // Cargar todos los eventos
  const cargarEventos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/calendar-events`);
      setEventos(res.data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar warnings descartados para un mes específico
  const cargarWarningsDescartados = useCallback(async (mesAno) => {
    try {
      const res = await axios.get(`${API_URL}/dismissed-warnings/${mesAno}`);
      setDismissedWarnings(prev => ({
        ...prev,
        [mesAno]: new Set(res.data)
      }));
    } catch (err) {
      console.error('Error al cargar warnings descartados:', err);
    }
  }, []);

  // Crear nuevo evento
  const crearEvento = useCallback(async (eventoData) => {
    try {
      const res = await axios.post(`${API_URL}/calendar-events`, eventoData);
      setEventos(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error('Error al crear evento:', err);
      throw err;
    }
  }, []);

  // Actualizar evento
  const actualizarEvento = useCallback(async (id, eventoData) => {
    try {
      const res = await axios.put(`${API_URL}/calendar-events/${id}`, eventoData);
      setEventos(prev =>
        prev.map(evt => (evt.id === id ? res.data : evt))
      );
      return res.data;
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      throw err;
    }
  }, []);

  // Desactivar evento
  const desactivarEvento = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/calendar-events/${id}`);
      setEventos(prev => prev.filter(evt => evt.id !== id));
    } catch (err) {
      console.error('Error al desactivar evento:', err);
      throw err;
    }
  }, []);

  // Descartar warning para un mes específico
  const descartarWarning = useCallback(async (eventoId, mesAno) => {
    try {
      await axios.post(`${API_URL}/dismissed-warnings`, {
        evento_id: eventoId,
        mes_ano: mesAno
      });
      setDismissedWarnings(prev => ({
        ...prev,
        [mesAno]: new Set([...(prev[mesAno] || new Set()), eventoId])
      }));
    } catch (err) {
      console.error('Error al descartar warning:', err);
      throw err;
    }
  }, []);

  // Obtener eventos aplicables para un mes específico
  const getEventosPorMes = useCallback((anio, mes) => {
    return eventos.filter(evento => {
      const recurrencia = typeof evento.recurrencia === 'string' 
        ? JSON.parse(evento.recurrencia) 
        : evento.recurrencia;

      // Verificar si el evento aplica a este mes
      const mesAno = `${anio}-${String(mes + 1).padStart(2, '0')}`;
      
      if (recurrencia.tipo === 'unica') {
        // Evento único: solo si es el mes/año exacto
        return recurrencia.mesAno === mesAno;
      }

      if (recurrencia.tipo === 'anual') {
        // Evento anual: todos los años en el mes especificado
        return Number(mes) === Number(recurrencia.mes);
      }

      if (recurrencia.tipo === 'semestral') {
        // Cada 6 meses desde el mes de inicio
        const mesInicio = Number(recurrencia.mesInicio);
        const mesActual = Number(mes);
        return mesActual === mesInicio || mesActual === (mesInicio + 6) % 12;
      }

      if (recurrencia.tipo === 'trimestral') {
        // Cada 3 meses desde el mes de inicio
        const mesInicio = Number(recurrencia.mesInicio);
        const mesActual = Number(mes);
        return (mesActual - mesInicio + 12) % 12 === 0 ||
               (mesActual - mesInicio + 12) % 12 === 3 ||
               (mesActual - mesInicio + 12) % 12 === 6 ||
               (mesActual - mesInicio + 12) % 12 === 9;
      }

      if (recurrencia.tipo === 'mensual') {
        // Todos los meses
        return true;
      }

      if (recurrencia.tipo === 'cadaX') {
        // Cada X meses desde un mes inicial
        const mesInicio = Number(recurrencia.mesInicio);
        const cadaX = Number(recurrencia.cadaX);
        const mesActual = Number(mes);
        return (mesActual - mesInicio + 120) % cadaX === 0;
      }

      return false;
    });
  }, [eventos]);

  // Cargar eventos al iniciar
  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const value = {
    eventos,
    dismissedWarnings,
    loading,
    cargarEventos,
    cargarWarningsDescartados,
    crearEvento,
    actualizarEvento,
    desactivarEvento,
    descartarWarning,
    getEventosPorMes
  };

  return (
    <CalendarEventsContext.Provider value={value}>
      {children}
    </CalendarEventsContext.Provider>
  );
};

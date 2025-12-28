import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Header = ({ title, subtitle }) => {
  const { t, language, changeLanguage } = useLanguage();
  const [fechaHora, setFechaHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearFechaHora = () => {
    const opciones = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return fechaHora.toLocaleDateString(language === 'ca' ? 'ca-ES' : 'gl-ES', opciones);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, marginBottom: 6, color: '#1d1d1f', letterSpacing: '-0.5px' }}>
          {title || t('parvosHub')}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'right', whiteSpace: 'nowrap' }}>
          {formatearFechaHora()}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => changeLanguage('ca')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: language === 'ca' ? '#007aff' : '#f0f0f0',
              color: language === 'ca' ? '#fff' : '#1d1d1f',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (language !== 'ca') e.target.style.background = '#e5e5e7';
            }}
            onMouseOut={(e) => {
              if (language !== 'ca') e.target.style.background = '#f0f0f0';
            }}
          >
            Català
          </button>
          <button
            onClick={() => changeLanguage('gl')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: language === 'gl' ? '#007aff' : '#f0f0f0',
              color: language === 'gl' ? '#fff' : '#1d1d1f',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (language !== 'gl') e.target.style.background = '#e5e5e7';
            }}
            onMouseOut={(e) => {
              if (language !== 'gl') e.target.style.background = '#f0f0f0';
            }}
          >
            Galego
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

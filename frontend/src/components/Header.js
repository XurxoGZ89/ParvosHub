import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import usePrivacyStore from '../stores/privacyStore';

const Header = ({ title, subtitle }) => {
  const { t, language, changeLanguage } = useLanguage();
  const { hiddenNumbers, toggleHiddenNumbers } = usePrivacyStore();
  const [fechaHora, setFechaHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearFechaHora = () => {
    const dia = String(fechaHora.getDate()).padStart(2, '0');
    const mes = String(fechaHora.getMonth() + 1).padStart(2, '0');
    const anio = fechaHora.getFullYear();
    const horas = String(fechaHora.getHours()).padStart(2, '0');
    const minutos = String(fechaHora.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio}, ${horas}:${minutos}`;
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
        <button
          onClick={toggleHiddenNumbers}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: hiddenNumbers ? '#7c3aed' : '#f0f0f0',
            color: hiddenNumbers ? '#fff' : '#1d1d1f',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 'fit-content'
          }}
          onMouseOver={(e) => {
            e.target.style.background = hiddenNumbers ? '#6d28d9' : '#e5e5e7';
          }}
          onMouseOut={(e) => {
            e.target.style.background = hiddenNumbers ? '#7c3aed' : '#f0f0f0';
          }}
          title={hiddenNumbers ? 'Mostrar números' : 'Ocultar números'}
        >
          {hiddenNumbers ? (
            <>
              <EyeOff size={16} />
              <span>Oculto</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>Visible</span>
            </>
          )}
        </button>
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

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';

function ListaCompra({ onBack }) {
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Header title={t('listaCompra')} />

        {/* Botón atrás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e7',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: '#007AFF',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f5f5f7';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#fff';
              e.target.style.boxShadow = 'none';
            }}
          >
            ← {t('volver')}
          </button>
        </div>

        {/* Contenido */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 60, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }}>🛒</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1d1d1f', marginBottom: 12 }}>{t('listaCompra')}</h2>
          <p style={{ fontSize: '1.1rem', color: '#86868b', marginBottom: 32 }}>{t('proximamente')}</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>Esta página está en desarrollo</p>
        </div>
      </div>
    </div>
  );
}

export default ListaCompra;

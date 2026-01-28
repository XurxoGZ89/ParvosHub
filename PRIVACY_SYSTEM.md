# Sistema de Privacidad - Ocultar/Mostrar Números

## 📍 Ubicación
- **Toggle**: Header (lado derecho) - Ojo normal/tachado
- **Estado**: Se guarda en localStorage
- **Persistencia**: Se mantiene al recargar la página

## 🔧 Cómo Usar

### 1. En Componentes React

```jsx
import usePrivacyStore from '../stores/privacyStore';
import { usePrivacyFormatter } from '../utils/privacyFormatter';

function MiComponente() {
  const { hiddenNumbers } = usePrivacyStore();
  const formatAmount = usePrivacyFormatter();
  
  return (
    <div>
      {/* Opción 1: Usando el estado directamente */}
      <span>{hiddenNumbers ? '•••••' : '125.50€'}</span>
      
      {/* Opción 2: Usando el formatter (recomendado) */}
      <span>{formatAmount(125.50)}€</span>
      
      {/* Opción 3: Condicional más limpia */}
      <span>{hiddenNumbers ? '••••' : '125.50'}€</span>
    </div>
  );
}
```

### 2. Formato de los Puntos

- Automático según número de dígitos
- Mínimo: 3 puntos (`•••`)
- Máximo: 10 puntos (para números grandes)
- Ejemplo: 5€ → `•••`, 123€ → `•••`, 1234567€ → `•••••••`

### 3. Componentes que Deben Implementarlo

**Priority 1 (Mostrar cifras):**
- Home.js - Totales de cuentas, resúmenes
- UserAccount.jsx - Saldos, operaciones
- ParvosAccountV3.jsx - Saldos familia, operaciones
- Dashboard/Widgets - Cifras principales

**Priority 2 (Información contextual):**
- Gráficos - Labels con cantidades
- Tablas - Columnas de importes
- Cards - Cifras en widgets

### 4. Toggle en Header

El botón aparece automáticamente en Header.js:
- **Estado Visible**: Ojo abierto + "Visible" + fondo gris
- **Estado Oculto**: Ojo tachado + "Oculto" + fondo púrpura
- **Tooltip**: Hover muestra "Mostrar números" o "Ocultar números"

## 📦 Archivos Creados

```
frontend/src/
├── stores/
│   └── privacyStore.js          # Store Zustand para estado global
├── utils/
│   └── privacyFormatter.js       # Utilidades de formateo
└── components/
    └── Header.js                 # Header actualizado con toggle
```

## 🔄 Flujo de Datos

```
Toggle Click → privacyStore.toggleHiddenNumbers()
    ↓
localStorage.setItem('hiddenNumbers', estado)
    ↓
Componentes se re-renderizan automáticamente
    ↓
usePrivacyFormatter() lee el nuevo estado
    ↓
Números se muestran u ocultan
```

## 💡 Ejemplo de Implementación en un Componente

```jsx
import { usePrivacyFormatter } from '../utils/privacyFormatter';

function CardSaldo({ saldo }) {
  const formatAmount = usePrivacyFormatter();
  
  return (
    <div className="card">
      <h3>Saldo Total</h3>
      <p className="amount">{formatAmount(saldo)}€</p>
    </div>
  );
}
```

## 🎨 Estilo del Botón

- Color Normal (Visible): Gris (#f0f0f0)
- Color Activo (Oculto): Púrpura (#7c3aed)
- Hover: Oscurece el color
- Incluye icono + texto
- Responsive

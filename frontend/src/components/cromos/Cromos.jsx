import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Copy, Minus, Plus, Search, Sticker, X,
} from 'lucide-react';
import api from '../../lib/api';
import MobileHeader from '../mobile/MobileHeader';
import { GRUPOS, SECCIONES, TOTAL_CROMOS } from '../../data/cromosLiga2026';

const COLECCION = 'liga-2026-27';
const STORAGE_ABIERTAS = 'cromos-secciones-abiertas';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'faltan', label: 'Faltan' },
  { id: 'tengo', label: 'Tengo' },
  { id: 'repes', label: 'Repes' },
];

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const normalizar = (txt) =>
  txt.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const leerAbiertas = () => {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_ABIERTAS) || '[]');
    return new Set(Array.isArray(v) ? v : []);
  } catch {
    return new Set();
  }
};

const guardarAbiertas = (set) => {
  try {
    localStorage.setItem(STORAGE_ABIERTAS, JSON.stringify([...set]));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
};

// ─── Barra de progreso ──────────────────────────────────────────────
const Barra = ({ valor, total, grande = false, clara = false }) => {
  const p = pct(valor, total);
  const completa = total > 0 && valor === total;
  return (
    <div
      className={`w-full ${grande ? 'h-3' : 'h-1.5'} rounded-full overflow-hidden ${
        clara ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800'
      }`}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          clara
            ? 'bg-white'
            : completa
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-purple-600 to-pink-500'
        }`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
};

// ─── Fila de cromo ──────────────────────────────────────────────────
const FilaCromo = ({ cromo, cantidad, onCambiar }) => {
  const tengo = cantidad > 0;
  const repes = Math.max(0, cantidad - 1);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
        tengo
          ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/60'
          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={() => onCambiar(cromo.id, tengo ? 0 : 1)}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        aria-pressed={tengo}
        aria-label={`${cromo.numero} ${cromo.nombre}: ${tengo ? 'lo tengo' : 'me falta'}`}
      >
        <span
          className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${
            tengo
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {tengo && <Check className="w-4 h-4" strokeWidth={3} />}
        </span>
        <span className="w-9 sm:w-11 shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
          {cromo.numero}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium truncate ${
              cromo.sinNombre
                ? 'italic text-slate-400'
                : tengo
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {cromo.nombre}
          </span>
          {(cromo.posicion || cromo.segundaEdicion) && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 capitalize">
              {cromo.posicion}
              {cromo.segundaEdicion && (
                <span className="normal-case font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 rounded">
                  2ª ed
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      {tengo && (
        <div className="flex items-center gap-1 shrink-0" aria-label="Repetidos">
          <button
            type="button"
            onClick={() => onCambiar(cromo.id, cantidad - 1)}
            disabled={repes === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Quitar un repetido"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span
            className={`min-w-[2.25rem] text-center text-xs font-bold rounded-md px-1 py-0.5 tabular-nums ${
              repes > 0
                ? 'bg-pink-500 text-white'
                : 'text-slate-400'
            }`}
            title="Repetidos"
          >
            {repes > 0 ? `+${repes}` : '0'}
          </span>
          <button
            type="button"
            onClick={() => onCambiar(cromo.id, cantidad + 1)}
            disabled={cantidad >= 99}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800"
            aria-label="Añadir un repetido"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Sección (equipo / especial) ────────────────────────────────────
const Seccion = ({ seccion, cromosVisibles, coleccion, abierta, forzarAbierta, onToggle, onCambiar }) => {
  const total = seccion.cromos.length;
  const tengo = seccion.cromos.filter((c) => (coleccion[c.id] || 0) > 0).length;
  const repes = seccion.cromos.reduce((acc, c) => acc + Math.max(0, (coleccion[c.id] || 0) - 1), 0);
  const completa = tengo === total;
  const expandida = abierta || forzarAbierta;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(seccion.id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        aria-expanded={expandida}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{seccion.nombre}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {repes > 0 && (
                <span className="text-[11px] font-semibold text-pink-600 bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded-full">
                  {repes} repe{repes === 1 ? '' : 's'}
                </span>
              )}
              <span
                className={`text-xs font-bold tabular-nums ${
                  completa ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tengo}/{total}
              </span>
            </div>
          </div>
          <Barra valor={tengo} total={total} />
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${expandida ? 'rotate-180' : ''}`}
        />
      </button>

      {expandida && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2">
          {cromosVisibles.map((c) => (
            <FilaCromo key={c.id} cromo={c} cantidad={coleccion[c.id] || 0} onCambiar={onCambiar} />
          ))}
        </div>
      )}
    </section>
  );
};

// ─── Página ─────────────────────────────────────────────────────────
const Cromos = ({ mobile = false }) => {
  const [coleccion, setColeccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [abiertas, setAbiertas] = useState(leerAbiertas);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const pendientes = useRef({});
  const confirmado = useRef({}); // último estado guardado en el servidor
  const avisoTimer = useRef(null);

  const mostrarAviso = useCallback((texto, tipo = 'ok') => {
    setAviso({ texto, tipo });
    clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 2500);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await api.get('/api/cromos', { params: { coleccion: COLECCION } });
      confirmado.current = { ...(data.cromos || {}) };
      setColeccion(data.cromos || {});
    } catch (err) {
      console.error('Error cargando cromos:', err);
      setError('No se pudo cargar la colección. Puede que el servidor esté despertando: prueba de nuevo en unos segundos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Los guardados pendientes NO se cancelan al salir: deben llegar al servidor.
    return () => clearTimeout(avisoTimer.current);
  }, [cargar]);

  // Cambio optimista + guardado con pequeño retardo (agrupa varios toques en +/−)
  const cambiarCantidad = useCallback((cromoId, cantidad) => {
    const nueva = Math.max(0, Math.min(99, cantidad));
    setColeccion((prev) => {
      const next = { ...prev };
      if (nueva === 0) delete next[cromoId];
      else next[cromoId] = nueva;
      return next;
    });

    clearTimeout(pendientes.current[cromoId]);
    pendientes.current[cromoId] = setTimeout(async () => {
      delete pendientes.current[cromoId];
      try {
        await api.put(`/api/cromos/${cromoId}`, { cantidad: nueva, coleccion: COLECCION });
        if (nueva === 0) delete confirmado.current[cromoId];
        else confirmado.current[cromoId] = nueva;
      } catch (err) {
        console.error('Error guardando cromo:', err);
        const anterior = confirmado.current[cromoId] || 0;
        setColeccion((prev) => {
          const next = { ...prev };
          if (anterior === 0) delete next[cromoId];
          else next[cromoId] = anterior;
          return next;
        });
        mostrarAviso('No se pudo guardar. Inténtalo de nuevo.', 'error');
      }
    }, 400);
  }, [mostrarAviso]);

  const toggleSeccion = useCallback((id) => {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      guardarAbiertas(next);
      return next;
    });
  }, []);

  const expandirTodo = (abrir) => {
    const next = abrir ? new Set(SECCIONES.map((s) => s.id)) : new Set();
    guardarAbiertas(next);
    setAbiertas(next);
  };

  // Totales
  const stats = useMemo(() => {
    let tengo = 0;
    let repes = 0;
    SECCIONES.forEach((s) =>
      s.cromos.forEach((c) => {
        const n = coleccion[c.id] || 0;
        if (n > 0) tengo += 1;
        if (n > 1) repes += n - 1;
      })
    );
    return { tengo, repes, faltan: TOTAL_CROMOS - tengo };
  }, [coleccion]);

  // Filtro + búsqueda
  const termino = normalizar(busqueda.trim());
  const filtrando = filtro !== 'todos' || termino.length > 0;

  const seccionesVisibles = useMemo(() => {
    return SECCIONES.map((s) => {
      const coincideSeccion = termino && normalizar(s.nombre).includes(termino);
      const cromos = s.cromos.filter((c) => {
        const n = coleccion[c.id] || 0;
        if (filtro === 'faltan' && n > 0) return false;
        if (filtro === 'tengo' && n === 0) return false;
        if (filtro === 'repes' && n < 2) return false;
        if (!termino || coincideSeccion) return true;
        return normalizar(`${c.numero} ${c.nombre}`).includes(termino);
      });
      return { seccion: s, cromos };
    }).filter((x) => !filtrando || x.cromos.length > 0);
  }, [coleccion, filtro, termino, filtrando]);

  // Copiar lista (faltan o repes) para intercambiar
  const copiarLista = async (tipo) => {
    const lineas = [];
    SECCIONES.forEach((s) => {
      const items = s.cromos
        .filter((c) => {
          const n = coleccion[c.id] || 0;
          return tipo === 'faltan' ? n === 0 : n > 1;
        })
        .map((c) => {
          const n = coleccion[c.id] || 0;
          return tipo === 'repes' && n > 2 ? `${c.numero} (x${n - 1})` : c.numero;
        });
      if (items.length) lineas.push(`${s.nombre}: ${items.join(', ')}`);
    });
    const titulo = tipo === 'faltan' ? `Me faltan (${stats.faltan})` : `Repetidos (${stats.repes})`;
    const texto = `LALIGA 2026-27 · ${titulo}\n${lineas.join('\n')}`;
    try {
      await navigator.clipboard.writeText(texto);
      mostrarAviso(tipo === 'faltan' ? 'Lista de faltas copiada' : 'Lista de repes copiada');
    } catch {
      mostrarAviso('No se pudo copiar al portapapeles', 'error');
    }
  };

  const todasAbiertas = abiertas.size === SECCIONES.length;

  return (
    <div className={mobile ? 'min-h-full bg-slate-50 dark:bg-slate-950' : ''}>
      {mobile && <MobileHeader title="Cromos LALIGA" />}

      {aviso && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            aviso.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          }`}
          role="status"
        >
          {aviso.texto}
        </div>
      )}

      <div className={`${mobile ? 'px-4 py-4' : ''} space-y-4 max-w-6xl`}>
        {/* Resumen */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-purple-600/20">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Sticker className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold leading-tight">Álbum LALIGA 2026-27</h2>
                <p className="text-xs sm:text-sm text-white/80">Panini · Colección compartida</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl sm:text-4xl font-extrabold tabular-nums leading-none">
                {pct(stats.tengo, TOTAL_CROMOS)}%
              </p>
            </div>
          </div>
          <Barra valor={stats.tengo} total={TOTAL_CROMOS} grande clara />
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-white/15 rounded-xl py-2">
              <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.tengo}</p>
              <p className="text-[11px] sm:text-xs text-white/80">de {TOTAL_CROMOS} tengo</p>
            </div>
            <div className="bg-white/15 rounded-xl py-2">
              <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.faltan}</p>
              <p className="text-[11px] sm:text-xs text-white/80">me faltan</p>
            </div>
            <div className="bg-white/15 rounded-xl py-2">
              <p className="text-lg sm:text-xl font-bold tabular-nums">{stats.repes}</p>
              <p className="text-[11px] sm:text-xs text-white/80">repetidos</p>
            </div>
          </div>
        </div>

        {/* Herramientas */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar jugador, número o equipo…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Borrar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 lg:flex-none bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={`flex-1 lg:flex-none px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    filtro === f.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => expandirTodo(!todasAbiertas)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              title={todasAbiertas ? 'Colapsar todo' : 'Expandir todo'}
            >
              {todasAbiertas ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
              <span className="hidden sm:inline">{todasAbiertas ? 'Colapsar' : 'Expandir'}</span>
            </button>
            {(filtro === 'faltan' || filtro === 'repes') && (
              <button
                type="button"
                onClick={() => copiarLista(filtro)}
                title="Copiar lista para intercambiar"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copiar lista</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={cargar}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              Reintentar
            </button>
          </div>
        ) : seccionesVisibles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
            {filtro === 'faltan' && !termino
              ? '¡Álbum completo! No te falta ningún cromo 🎉'
              : filtro === 'repes' && !termino
                ? 'Todavía no has apuntado ningún repetido.'
                : 'No hay cromos que coincidan con la búsqueda.'}
          </div>
        ) : (
          GRUPOS.map((g) => {
            const items = seccionesVisibles.filter((x) => x.seccion.grupo === g.id);
            if (!items.length) return null;
            return (
              <div key={g.id} className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
                  {g.nombre}
                </h3>
                {items.map(({ seccion, cromos }) => (
                  <Seccion
                    key={seccion.id}
                    seccion={seccion}
                    cromosVisibles={cromos}
                    coleccion={coleccion}
                    abierta={abiertas.has(seccion.id)}
                    forzarAbierta={filtrando}
                    onToggle={toggleSeccion}
                    onCambiar={cambiarCantidad}
                  />
                ))}
              </div>
            );
          })
        )}

        <p className="text-center text-[11px] text-slate-400 pt-2 pb-6">
          Toca un cromo para marcarlo. Con + y − apuntas los repetidos.
        </p>
      </div>
    </div>
  );
};

export default Cromos;

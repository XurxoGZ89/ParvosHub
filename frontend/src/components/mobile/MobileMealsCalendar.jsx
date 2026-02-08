import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Search, Sun, Moon, Trash2, Check, Package, ShoppingCart, Beef, Fish, Salad, UtensilsCrossed } from 'lucide-react';
import MobileHeader from './MobileHeader';
import MobileSheet from './MobileSheet';
import api from '../../lib/api';

const CATEGORIAS = [
  { value: 'carne', label: 'Carne', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Beef, dot: 'bg-red-400' },
  { value: 'pescado', label: 'Pescado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Fish, dot: 'bg-blue-400' },
  { value: 'vegetariano', label: 'Vegetariano', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Salad, dot: 'bg-green-400' },
  { value: 'otros', label: 'Otros', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: UtensilsCrossed, dot: 'bg-slate-400' },
];

const getCatInfo = (cat) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[3];

const MobileMealsCalendar = () => {
  const [semanaActual, setSemanaActual] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [comidasCongeladas, setComidasCongeladas] = useState([]);
  const [comidasPlanificadas, setComidasPlanificadas] = useState([]);
  const [showDespensa, setShowDespensa] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [textoLibre, setTextoLibre] = useState('');
  const [tipoComidaAdd, setTipoComidaAdd] = useState('comida');
  const [fechaAdd, setFechaAdd] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [listaCompra, setListaCompra] = useState([]);
  const [showLista, setShowLista] = useState(false);
  const [nuevoItem, setNuevoItem] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState('');
  const [nuevoProductoCat, setNuevoProductoCat] = useState('otros');
  const [nuevoProductoCad, setNuevoProductoCad] = useState('');
  const [toast, setToast] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [congRes, planRes] = await Promise.all([
        api.get('/comidas-congeladas'),
        api.get('/comidas-planificadas')
      ]);
      setComidasCongeladas(congRes.data);
      setComidasPlanificadas(planRes.data);
    } catch (e) { console.error('Error:', e); }
  }, []);

  useEffect(() => { cargarDatos(); const s = localStorage.getItem('parvos_lista_compra'); if (s) setListaCompra(JSON.parse(s)); }, [cargarDatos]);
  useEffect(() => { localStorage.setItem('parvos_lista_compra', JSON.stringify(listaCompra)); }, [listaCompra]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); } }, [toast]);

  const fechasSemana = useMemo(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    const diaSemana = hoy.getDay();
    const diffALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    primerDia.setDate(hoy.getDate() + diffALunes + (semanaActual * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(primerDia); f.setDate(primerDia.getDate() + i);
      return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}`;
    });
  }, [semanaActual]);

  const hoyStr = useMemo(() => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
  }, []);

  const diasCortos = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const getComidasDia = useCallback((fecha, tipo) => comidasPlanificadas.filter(c => c.fecha === fecha && c.tipo_comida === tipo), [comidasPlanificadas]);

  // Estadísticas
  const stats = useMemo(() => {
    const plan = comidasPlanificadas.filter(c => fechasSemana.includes(c.fecha)).length;
    const disp = comidasCongeladas.filter(c => !c.tachada).length;
    return { plan, disp, pct: Math.round((plan / 14) * 100) };
  }, [comidasPlanificadas, comidasCongeladas, fechasSemana]);

  useEffect(() => {
    if (selectedDay === null) {
      const h = new Date();
      const diaSemana = h.getDay();
      setSelectedDay(diaSemana === 0 ? 6 : diaSemana - 1);
    }
  }, [selectedDay]);

  const handleAddFromDespensa = async (comida, fecha, tipoComida) => {
    try {
      await api.post('/comidas-planificadas', {
        comida_id: comida.id, fecha, tipo_comida: tipoComida, comida_nombre: comida.nombre, categoria: comida.categoria
      });
      await api.put(`/comidas-congeladas/${comida.id}`, { tachada: true });
      await cargarDatos(); setToast('✓ Planificada');
    } catch { setToast('Error'); }
  };

  const handleAddTextoLibre = async () => {
    if (!textoLibre.trim() || !fechaAdd) return;
    try {
      await api.post('/comidas-planificadas', { comida_id: null, fecha: fechaAdd, tipo_comida: tipoComidaAdd, comida_nombre: textoLibre.trim(), categoria: 'comer_fuera' });
      await cargarDatos(); setTextoLibre(''); setShowAddMeal(false); setToast('✓ Añadida');
    } catch { setToast('Error'); }
  };

  const handleEliminarPlanificada = async (id, comidaId) => {
    try {
      await api.delete(`/comidas-planificadas/${id}`);
      if (comidaId) {
        const otras = comidasPlanificadas.filter(c => c.comida_id === comidaId && c.id !== id);
        if (otras.length === 0) await api.put(`/comidas-congeladas/${comidaId}`, { tachada: false });
      }
      await cargarDatos(); setToast('✓ Eliminada');
    } catch { setToast('Error'); }
  };

  const handleAddProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.trim()) return;
    try {
      let cad = null;
      if (nuevoProductoCad) { const [y,m,d] = nuevoProductoCad.split('-').map(Number); cad = new Date(y,m-1,d,12,0,0).toISOString(); }
      await api.post('/comidas-congeladas', { nombre: nuevoProducto.trim(), categoria: nuevoProductoCat, fecha_caducidad: cad });
      await cargarDatos(); setNuevoProducto(''); setNuevoProductoCat('otros'); setNuevoProductoCad(''); setShowAddProduct(false); setToast('✓ Añadido');
    } catch { setToast('Error'); }
  };

  const handleEliminarProducto = async (id) => {
    try { await api.delete(`/comidas-congeladas/${id}`); await cargarDatos(); setToast('✓ Eliminado'); }
    catch { setToast('Error'); }
  };

  const selectedFecha = fechasSemana[selectedDay] || fechasSemana[0];
  const getCatDot = (cat, manual) => {
    if (manual || cat === 'comer_fuera') return 'bg-amber-400';
    const c = CATEGORIAS.find(x => x.value === cat); return c ? c.dot : 'bg-slate-300';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MobileHeader title="Calendario Comidas" />

      <div className="px-4 py-3 pb-28 space-y-3">
        {/* Semana nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSemanaActual(semanaActual - 1)} className="p-2 text-slate-400 active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setSemanaActual(0)} className="text-sm font-bold text-slate-800 dark:text-white">
            {semanaActual === 0 ? 'Esta semana' : semanaActual === 1 ? 'Próxima semana' : semanaActual === -1 ? 'Semana pasada' : `Semana ${semanaActual > 0 ? '+' : ''}${semanaActual}`}
          </button>
          <button onClick={() => setSemanaActual(semanaActual + 1)} className="p-2 text-slate-400 active:scale-90"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Stats mini */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Plan</span>
            <div className="flex items-center gap-1.5">
              <div className="w-10 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
              </div>
              <span className="text-[10px] font-bold text-purple-600">{stats.plan}/14</span>
            </div>
          </div>
          <button onClick={() => setShowDespensa(true)} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 active:scale-95">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{stats.disp}</span>
          </button>
          <button onClick={() => setShowLista(true)} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 active:scale-95">
            <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{listaCompra.length}</span>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1.5">
          {fechasSemana.map((fecha, i) => {
            const isToday = fecha === hoyStr;
            const isSelected = i === selectedDay;
            const day = parseInt(fecha.split('-')[2]);
            const comidas = getComidasDia(fecha, 'comida');
            const cenas = getComidasDia(fecha, 'cena');
            const hasContent = comidas.length > 0 || cenas.length > 0;
            return (
              <button key={fecha} onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all active:scale-90 ${
                  isSelected ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' :
                  isToday ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{diasCortos[i]}</span>
                <span className="text-sm font-bold">{day}</span>
                {hasContent && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-purple-400'}`} />}
              </button>
            );
          })}
        </div>

        {/* Detalle del día seleccionado */}
        <div className="space-y-2">
          {/* Comida */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Comida</span>
              </div>
              <button onClick={() => { setTipoComidaAdd('comida'); setFechaAdd(selectedFecha); setShowAddMeal(true); }}
                className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 active:scale-90">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {getComidasDia(selectedFecha, 'comida').length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {getComidasDia(selectedFecha, 'comida').map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getCatDot(c.categoria, !c.comida_id)}`} />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{c.comida_nombre}</span>
                    <button onClick={() => handleEliminarPlanificada(c.id, c.comida_id)} className="p-1 text-slate-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-xs text-slate-400">Sin planificar</div>
            )}
          </div>

          {/* Cena */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cena</span>
              </div>
              <button onClick={() => { setTipoComidaAdd('cena'); setFechaAdd(selectedFecha); setShowAddMeal(true); }}
                className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 active:scale-90">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {getComidasDia(selectedFecha, 'cena').length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {getComidasDia(selectedFecha, 'cena').map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getCatDot(c.categoria, !c.comida_id)}`} />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{c.comida_nombre}</span>
                    <button onClick={() => handleEliminarPlanificada(c.id, c.comida_id)} className="p-1 text-slate-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-xs text-slate-400">Sin planificar</div>
            )}
          </div>
        </div>

        {/* Despensa inline preview */}
        {!showDespensa && comidasCongeladas.filter(c => !c.tachada).length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setShowDespensa(true)} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Despensa disponible</span>
              </div>
              <span className="text-xs text-slate-400">{comidasCongeladas.filter(c => !c.tachada).length} productos →</span>
            </button>
            <div className="px-4 py-3 space-y-1.5">
              {comidasCongeladas.filter(c => !c.tachada).slice(0, 3).map(c => {
                const cat = getCatInfo(c.categoria);
                const CatIcon = cat.icon;
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                    <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">{c.nombre}</span>
                  </div>
                );
              })}
              {comidasCongeladas.filter(c => !c.tachada).length > 3 && (
                <p className="text-[10px] text-slate-400 text-center pt-1">
                  +{comidasCongeladas.filter(c => !c.tachada).length - 3} más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lista de compra inline preview */}
        {!showLista && listaCompra.filter(l => !l.tachada).length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setShowLista(true)} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Lista de compra</span>
              </div>
              <span className="text-xs text-slate-400">{listaCompra.filter(l => !l.tachada).length} productos →</span>
            </button>
            <div className="px-4 py-3 space-y-1.5">
              {listaCompra.filter(l => !l.tachada).slice(0, 3).map(l => (
                <div key={l.id} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">{l.nombre}</span>
                </div>
              ))}
              {listaCompra.filter(l => !l.tachada).length > 3 && (
                <p className="text-[10px] text-slate-400 text-center pt-1">
                  +{listaCompra.filter(l => !l.tachada).length - 3} más
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Add Meal Sheet */}
      <MobileSheet isOpen={showAddMeal} onClose={() => setShowAddMeal(false)} title={`Añadir ${tipoComidaAdd}`}>
        <div className="space-y-4">
          {/* Texto libre */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Escribir manualmente</label>
            <div className="flex gap-2">
              <input type="text" value={textoLibre} onChange={(e) => setTextoLibre(e.target.value)}
                className="flex-1 h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                placeholder="Ej. Pizza casera" />
              <button onClick={handleAddTextoLibre} disabled={!textoLibre.trim()}
                className="px-4 bg-purple-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95">
                Añadir
              </button>
            </div>
          </div>

          {/* Desde despensa */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">O elegir de la despensa</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {comidasCongeladas.filter(c => !c.tachada).map(c => {
                const cat = getCatInfo(c.categoria);
                const CatIcon = cat.icon;
                return (
                  <button key={c.id} onClick={() => { handleAddFromDespensa(c, fechaAdd, tipoComidaAdd); setShowAddMeal(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-left active:scale-[0.98]">
                    <div className={`w-2 h-2 rounded-full ${cat.dot}`} />
                    <CatIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">{c.nombre}</span>
                  </button>
                );
              })}
              {comidasCongeladas.filter(c => !c.tachada).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Despensa vacía</p>
              )}
            </div>
          </div>
        </div>
      </MobileSheet>

      {/* Despensa Sheet */}
      <MobileSheet isOpen={showDespensa} onClose={() => setShowDespensa(false)} title="Despensa" fullHeight>
        <div className="space-y-3">
          <button onClick={() => { setShowDespensa(false); setShowAddProduct(true); }}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl text-sm active:scale-[0.98]">
            <Plus className="w-4 h-4 inline mr-1" /> Añadir producto
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              placeholder="Buscar..." />
          </div>
          <div className="space-y-1.5">
            {comidasCongeladas.filter(c => !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(c => {
              const cat = getCatInfo(c.categoria);
              const CatIcon = cat.icon;
              return (
                <div key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${c.tachada ? 'opacity-40 bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                  <div className={`w-2 h-2 rounded-full ${cat.dot}`} />
                  <CatIcon className="w-4 h-4 text-slate-500" />
                  <span className={`flex-1 text-sm ${c.tachada ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{c.nombre}</span>
                  <button onClick={() => handleEliminarProducto(c.id)} className="p-1 text-slate-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>
        </div>
      </MobileSheet>

      {/* Add Product Sheet */}
      <MobileSheet isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} title="Nuevo Producto">
        <form onSubmit={handleAddProducto} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Nombre</label>
            <input type="text" value={nuevoProducto} onChange={(e) => setNuevoProducto(e.target.value)}
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Ej. Pollo" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIAS.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <button key={cat.value} type="button" onClick={() => setNuevoProductoCat(cat.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold ${
                      nuevoProductoCat === cat.value ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                    <CatIcon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Caducidad (opcional)</label>
            <input type="date" value={nuevoProductoCad} onChange={(e) => setNuevoProductoCad(e.target.value)}
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
          </div>
          <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl active:scale-[0.98] text-sm">
            Añadir a Despensa
          </button>
        </form>
      </MobileSheet>

      {/* Lista de compra Sheet */}
      <MobileSheet isOpen={showLista} onClose={() => setShowLista(false)} title="Lista de Compra">
        <div className="space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); if (!nuevoItem.trim()) return; setListaCompra(prev => [...prev, { id: Date.now(), nombre: nuevoItem.trim(), checked: false }]); setNuevoItem(''); }}
            className="flex gap-2">
            <input type="text" value={nuevoItem} onChange={(e) => setNuevoItem(e.target.value)}
              className="flex-1 h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              placeholder="Añadir item..." />
            <button type="submit" className="px-4 bg-purple-600 text-white rounded-xl text-sm font-semibold active:scale-95">+</button>
          </form>
          <div className="space-y-1.5">
            {listaCompra.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <button onClick={() => setListaCompra(prev => prev.map(i => i.id === item.id ? {...i, checked: !i.checked} : i))}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${item.checked ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{item.nombre}</span>
                <button onClick={() => setListaCompra(prev => prev.filter(i => i.id !== item.id))} className="p-1 text-slate-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {listaCompra.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Lista vacía</p>}
          </div>
        </div>
      </MobileSheet>
    </div>
  );
};

export default MobileMealsCalendar;

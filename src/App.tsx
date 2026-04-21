/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, AlertCircle, Ruler, Info, Layers, ChevronLeft, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeamEntry {
  id: string;
  feet: number;
  inches: number;
  startFt: number;
  startIn: number;
  endFt: number;
  endIn: number;
  spacing: number;
  quantity: number;
}

interface SlabEntry {
  id: string;
  feet: number;
  inches: number;
  spacing: number;
  quantity: number;
}

type ViewMode = 'landing' | 'beam' | 'slab';

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  
  // Beam States
  const [beams, setBeams] = useState<BeamEntry[]>([]);
  const [lengthInput, setLengthInput] = useState<string>('');
  const [startOffsetInput, setStartOffsetInput] = useState<string>('');
  const [endOffsetInput, setEndOffsetInput] = useState<string>('');
  const [spacing, setSpacing] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Slab States
  const [slabLengthStr, setSlabLengthStr] = useState<string>('');
  const [slabSpacingStr, setSlabSpacingStr] = useState<string>('');
  const [slabHistory, setSlabHistory] = useState<SlabEntry[]>([]);

  const parseFtInStr = (val: string) => {
    if (!val) return { ft: 0, in: 0 };
    const parts = val.split('.');
    const ft = parseInt(parts[0], 10) || 0;
    const inches = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
    return { ft, in: inches };
  };

  const calculateQuantity = (lengthStr: string, startStr: string, endStr: string, s: number) => {
    const l = parseFtInStr(lengthStr);
    const start = parseFtInStr(startStr);
    const end = parseFtInStr(endStr);

    const totalIn = (l.ft * 12) + l.in;
    const startIn = (start.ft * 12) + start.in;
    const endIn = (end.ft * 12) + end.in;
    const effectiveSpan = totalIn - startIn - endIn;

    if (effectiveSpan < 0) {
      return null;
    }

    if (s <= 0) return 0;
    
    return Math.floor(effectiveSpan / s) + 1;
  };

  const handleAddBeam = () => {
    setError(null);
    const sp = parseFloat(spacing) || 0;

    if (!lengthInput || lengthInput === '.') {
      setError("Please enter beam length.");
      return;
    }
    if (sp <= 0) {
      setError("Please enter a valid spacing.");
      return;
    }

    const qty = calculateQuantity(lengthInput, startOffsetInput, endOffsetInput, sp);

    if (qty === null) {
      setError("Offsets exceed beam length.");
      return;
    }

    const l = parseFtInStr(lengthInput);
    const start = parseFtInStr(startOffsetInput);
    const end = parseFtInStr(endOffsetInput);

    const newBeam: BeamEntry = {
      id: crypto.randomUUID(),
      feet: l.ft,
      inches: l.in,
      startFt: start.ft,
      startIn: start.in,
      endFt: end.ft,
      endIn: end.in,
      spacing: sp,
      quantity: qty
    };
    
    setBeams([...beams, newBeam]);
    setLengthInput('');
  };

  const deleteBeam = (id: string) => {
    setBeams(beams.filter(b => b.id !== id));
  };

  const clearAll = () => {
    setBeams([]);
    setLengthInput('');
    setStartOffsetInput('');
    setEndOffsetInput('');
    setSpacing('');
    setError(null);
  };

  const finalTotal = useMemo(() => {
    return beams.reduce((sum, beam) => sum + beam.quantity, 0);
  }, [beams]);

  const slabResult = useMemo(() => {
    if (!slabLengthStr || !slabSpacingStr) return null;
    const l = parseFtInStr(slabLengthStr);
    const sp = parseFloat(slabSpacingStr);
    if (sp <= 0) return null;

    const totalIn = (l.ft * 12) + l.in;
    return Number((totalIn / sp).toFixed(2));
  }, [slabLengthStr, slabSpacingStr]);

  const handleSaveSlab = () => {
    if (slabResult === null) return;
    const lParsed = parseFtInStr(slabLengthStr);
    const newEntry: SlabEntry = {
      id: crypto.randomUUID(),
      feet: lParsed.ft,
      inches: lParsed.in,
      spacing: parseFloat(slabSpacingStr) || 0,
      quantity: slabResult
    };
    setSlabHistory([newEntry, ...slabHistory]);
    // Optionally clear inputs or keep them? User usually wants to see success.
  };

  const deleteSlabEntry = (id: string) => {
    setSlabHistory(slabHistory.filter(e => e.id !== id));
  };

  if (view === 'landing') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-8 bg-brand-card">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-12"
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.4em] text-brand-muted mb-2 font-bold">Industrial Construction Toolkit</span>
            <h1 className="text-6xl font-black tracking-tighter text-brand-text">
              RING<span className="text-brand-accent">PRO</span>
            </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => setView('beam')}
              className="group relative flex flex-col items-center justify-center p-10 space-y-4 border-2 border-brand-border bg-white rounded-3xl hover:border-brand-accent transition-all active:scale-95 shadow-xl shadow-black/5"
            >
              <div className="bg-brand-accent/10 p-4 rounded-2xl group-hover:bg-brand-accent group-hover:text-white transition-colors">
                <Plus size={32} />
              </div>
              <span className="text-xl tracking-wider uppercase font-black text-brand-text">Beam Ring</span>
              <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase opacity-60">Multi-Beam Calculator</p>
            </button>

            <button
              onClick={() => setView('slab')}
              className="group relative flex flex-col items-center justify-center p-10 space-y-4 border-2 border-brand-border bg-white rounded-3xl hover:border-brand-text transition-all active:scale-95 shadow-xl shadow-black/5"
            >
              <div className="bg-brand-text/10 p-4 rounded-2xl group-hover:bg-brand-text group-hover:text-white transition-colors">
                <Box size={32} />
              </div>
              <span className="text-xl tracking-wider uppercase font-black text-brand-text">Slab Rebar Count</span>
              <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase opacity-60">Single Area Calculator</p>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'slab') {
    const lParsed = parseFtInStr(slabLengthStr);
    return (
      <div className="flex flex-col h-screen p-4 max-w-[900px] mx-auto overflow-hidden">
        <header className="flex justify-between items-center border-b border-brand-border pb-3 mb-4">
          <button 
            onClick={() => setView('landing')} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-text transition-colors"
          >
            <ChevronLeft size={14} />
            Menu
          </button>
          <h1 className="text-xl font-black tracking-tight text-brand-text">
            SLAB<span className="text-brand-accent">COUNT</span>
          </h1>
        </header>

        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-xl shadow-black/5 mb-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 items-start">
            <div className="md:col-span-5 flex flex-col space-y-2">
              <label className="text-[10px] uppercase font-black text-brand-muted tracking-widest">Length (Ft.In)</label>
              <div className="input-box shadow-sm !p-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  className="input-field !text-sm"
                  value={slabLengthStr}
                  onChange={(e) => setSlabLengthStr(e.target.value)}
                />
              </div>
              {slabLengthStr && (
                <div className="text-[9px] font-bold text-brand-accent uppercase tracking-widest italic">
                  Input: {lParsed.ft}' {lParsed.in}"
                </div>
              )}
            </div>

            <div className="md:col-span-5 flex flex-col space-y-2">
              <label className="text-[10px] uppercase font-black text-brand-muted tracking-widest">Spacing (In)</label>
              <div className="input-box shadow-sm !p-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="6"
                  className="input-field !text-sm"
                  value={slabSpacingStr}
                  onChange={(e) => setSlabSpacingStr(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleSaveSlab}
                disabled={slabResult === null}
                className="btn-primary w-full h-[38px] flex items-center justify-center gap-2 group disabled:opacity-20 disabled:grayscale transition-all"
              >
                <Plus size={16} />
                <span className="text-[8px] uppercase font-black tracking-widest">Save</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-brand-card rounded-xl border border-brand-border">
            <div className="text-left">
              <h2 className="text-[9px] uppercase font-black tracking-[0.2em] text-brand-muted mb-1">Current Quantity</h2>
              <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest opacity-40">Exact Mathematical Division</p>
            </div>
            <div className="text-4xl font-black text-brand-text font-mono tracking-tighter">
              {slabResult !== null ? slabResult : '00'}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-brand-border flex justify-between text-[9px] font-mono text-brand-muted font-bold uppercase tracking-tighter opacity-60">
            <span>({lParsed.ft} × 12) + {lParsed.in} = {(lParsed.ft * 12) + lParsed.in} in</span>
            <span>Formula: Total Inches / Spacing</span>
          </div>
        </div>

        {/* Slab History */}
        <div className="flex-grow bg-white rounded-2xl border border-brand-border overflow-hidden flex flex-col shadow-xl shadow-black/5 min-h-0">
          <div className="grid grid-cols-12 bg-brand-card p-3 border-b border-brand-border text-[9px] uppercase font-black tracking-widest text-brand-muted font-bold">
            <div className="col-span-2">#</div>
            <div className="col-span-4">Length</div>
            <div className="col-span-2 text-center">Spc</div>
            <div className="col-span-3 text-right">Bars</div>
            <div className="col-span-1"></div>
          </div>

          <div className="scroll-area overflow-y-auto flex-grow">
            {slabHistory.length === 0 ? (
              <div className="p-8 text-center text-brand-muted/30">
                <p className="text-[9px] font-bold uppercase tracking-widest italic">No History</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {slabHistory.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-12 p-3 border-b border-brand-border data-row items-center hover:bg-brand-accent/[0.01]"
                  >
                    <div className="col-span-2 font-mono text-brand-muted text-[9px] font-bold">
                      {String(slabHistory.length - index).padStart(2, '0')}
                    </div>
                    <div className="col-span-4 text-sm font-black tracking-tighter">
                      {entry.feet}' {entry.inches}"
                    </div>
                    <div className="col-span-2 text-center font-mono font-bold text-xs text-brand-muted">
                      {entry.spacing}"
                    </div>
                    <div className="col-span-3 text-right text-lg font-black font-mono text-brand-accent tracking-tighter">
                      {entry.quantity}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => deleteSlabEntry(entry.id)}
                        className="text-brand-muted/40 hover:text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-brand-border divide-x divide-brand-border">
            <button
              onClick={() => { setSlabLengthStr(''); setSlabSpacingStr(''); }}
              className="py-3 text-[9px] uppercase font-black tracking-widest text-brand-muted hover:text-red-600 bg-brand-card/50 transition-colors"
            >
              Reset Inputs
            </button>
            <button
              disabled={slabHistory.length === 0}
              onClick={() => setSlabHistory([])}
              className="py-3 text-[9px] uppercase font-black tracking-widest text-brand-muted hover:text-red-600 bg-brand-card/50 transition-colors disabled:opacity-30"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 max-w-[1024px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-brand-border pb-6 mb-10">
        <button 
          onClick={() => setView('landing')} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-text transition-colors"
        >
          <ChevronLeft size={16} />
          Main Menu
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1 font-bold">Beam Calculator</span>
          <h1 className="text-2xl font-black tracking-tight text-brand-text">
            RING<span className="text-brand-accent">PRO</span>
          </h1>
        </div>
      </header>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 items-start">
        {/* Beam Dimensions & Add Button */}
        <div className="md:col-span-4 flex flex-col space-y-5">
          <div className="flex flex-col space-y-3">
            <label className="text-[11px] uppercase font-bold text-brand-text tracking-wider flex items-center gap-2">
              <Ruler size={14} className="text-brand-accent" />
              Length (Ft.In)
            </label>
            <div className="flex-1 input-box shadow-sm">
              <div className="text-[9px] uppercase text-brand-muted mb-1 font-mono tracking-widest font-bold">Ex: 12.06</div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                className="input-field"
                value={lengthInput}
                onChange={(e) => setLengthInput(e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={handleAddBeam}
            className="btn-primary w-fit px-10 h-16 text-base group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:rotate-90 transition-transform">+</span>
              <span className="text-[10px] uppercase font-black tracking-[0.2em]">Add Beam</span>
            </div>
          </button>
        </div>

        {/* Offsets */}
        <div className="md:col-span-5 flex flex-col space-y-3">
          <label className="text-[11px] uppercase font-bold text-brand-text tracking-wider flex items-center gap-2">
            <Layers size={14} className="text-brand-accent" />
            Offsets (Ft.In)
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 input-box shadow-sm">
              <div className="text-[9px] uppercase text-brand-muted mb-1 font-mono tracking-widest font-bold">Start</div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                className="input-field"
                value={startOffsetInput}
                onChange={(e) => setStartOffsetInput(e.target.value)}
              />
            </div>
            <div className="flex-1 input-box shadow-sm">
              <div className="text-[9px] uppercase text-brand-muted mb-1 font-mono tracking-widest font-bold">End</div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                className="input-field"
                value={endOffsetInput}
                onChange={(e) => setEndOffsetInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="md:col-span-3 flex flex-col space-y-3">
          <label className="text-[11px] uppercase font-bold text-brand-text tracking-wider">Spacing (In)</label>
          <div className="input-box shadow-sm">
            <div className="text-[9px] uppercase text-brand-muted mb-1 font-mono tracking-widest font-bold">Inches</div>
            <input
              type="number"
              inputMode="decimal"
              placeholder="6"
              className="input-field font-mono"
              value={spacing}
              onChange={(e) => setSpacing(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 flex items-center gap-3 text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm"
          >
            <AlertCircle size={18} />
            <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      <div className="flex-grow bg-white rounded-2xl border border-brand-border overflow-hidden flex flex-col min-h-[400px] shadow-xl shadow-black/5">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-brand-card p-5 border-b border-brand-border text-[10px] uppercase font-black tracking-[0.15em] text-brand-muted">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Length</div>
          <div className="col-span-3">Offsets</div>
          <div className="col-span-2 text-center">Spc</div>
          <div className="col-span-2 text-right">Rings</div>
          <div className="col-span-1"></div>
        </div>

        {/* Scrollable Rows */}
        <div className="scroll-area overflow-y-auto flex-grow">
          {beams.length === 0 ? (
            <div className="p-20 text-center text-brand-muted/30">
              <div className="bg-brand-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={40} className="opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Waiting for entries...</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {beams.map((beam, index) => (
                <motion.div
                  key={beam.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-12 p-5 border-b border-brand-border data-row items-center transition-colors hover:bg-brand-accent/[0.02]"
                >
                  <div className="col-span-1 font-mono text-brand-muted text-[10px] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="col-span-3 text-lg font-black tracking-tighter">
                    {beam.feet}' {beam.inches}"
                  </div>
                  <div className="col-span-3 text-[11px] font-bold text-brand-muted uppercase tracking-tight">
                    {beam.startFt}.{beam.startIn} <span className="opacity-40">/</span> {beam.endFt}.{beam.endIn}
                  </div>
                  <div className="col-span-2 text-center font-mono font-bold text-sm">
                    {beam.spacing}"
                  </div>
                  <div className="col-span-2 text-right text-2xl font-black font-mono text-brand-accent tracking-tighter">
                    {beam.quantity}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => deleteBeam(beam.id)}
                      className="text-brand-muted/40 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer / Total Section */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center bg-brand-text text-white p-8 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex space-x-6 w-full md:w-auto">
          <button
            onClick={clearAll}
            className="flex-1 md:flex-none px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[11px] uppercase font-black tracking-widest transition-all active:scale-95 text-white/80 hover:text-white"
          >
            Clear All
          </button>
        </div>

        <div className="flex items-center space-x-10 w-full md:w-auto justify-end mt-8 md:mt-0">
          <div className="text-right sr-only md:not-sr-only">
            <div className="text-[10px] uppercase text-white/40 tracking-[0.2em] font-bold">Active Beams</div>
            <div className="text-3xl font-black font-mono leading-none">{String(beams.length).padStart(2, '0')}</div>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block"></div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-brand-accent font-black tracking-[0.2em] mb-1">Grand Total Rings</div>
            <motion.div
              key={finalTotal}
              initial={{ scale: 1.2, color: '#F59E0B' }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              className="text-6xl font-black italic font-mono tracking-tighter leading-none"
            >
              {finalTotal}
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}

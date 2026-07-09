import React, { useState, useEffect } from 'react';

/**
 * DescriptionEditor — Structured product description editor for admin.
 *
 * Stores/loads a JSON string with shape:
 * { overview, features: string[], specs: Record<string,string>, inBox: string[] }
 *
 * Falls back gracefully if the stored value is plain text (old products).
 */

const EMPTY = { overview: '', features: [], specs: [], inBox: [] };

function parseDescription(raw) {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return {
        overview: parsed.overview || '',
        features: Array.isArray(parsed.features) ? parsed.features : [],
        specs: Array.isArray(parsed.specs)
          ? parsed.specs
          : Object.entries(parsed.specs || {}).map(([k, v]) => ({ key: k, value: v })),
        inBox: Array.isArray(parsed.inBox) ? parsed.inBox : [],
      };
    }
  } catch (_) {}
  // plain text fallback — put it in overview
  return { ...EMPTY, overview: raw };
}

function serializeDescription(state) {
  return JSON.stringify({
    overview: state.overview,
    features: state.features,
    specs: Object.fromEntries(state.specs.map(s => [s.key, s.value])),
    inBox: state.inBox,
  });
}

const TABS = [
  { id: 'overview',  label: 'Overview',        icon: '📋' },
  { id: 'features',  label: 'Key Features',    icon: '✨' },
  { id: 'specs',     label: 'Specifications',  icon: '⚙️' },
  { id: 'inBox',     label: "What's in Box",   icon: '📦' },
];

const inputCls = 'w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3.5 py-2 rounded-xl outline-none text-sm transition';

const DescriptionEditor = ({ value, onChange }) => {
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState(() => parseDescription(value));

  // Chip input states
  const [featureInput, setFeatureInput] = useState('');
  const [specKey, setSpecKey]     = useState('');
  const [specVal, setSpecVal]     = useState('');
  const [inBoxInput, setInBoxInput] = useState('');

  // Keep parent in sync
  useEffect(() => {
    onChange(serializeDescription(state));
  }, [state]);

  // When value changes externally (edit mode re-load)
  useEffect(() => {
    setState(parseDescription(value));
  }, []);  // only on mount

  const update = (field, val) => setState(prev => ({ ...prev, [field]: val }));

  // Features
  const addFeature = () => {
    const t = featureInput.trim();
    if (!t) return;
    update('features', [...state.features, t]);
    setFeatureInput('');
  };
  const removeFeature = idx => update('features', state.features.filter((_, i) => i !== idx));

  // Specs
  const addSpec = () => {
    const k = specKey.trim(), v = specVal.trim();
    if (!k || !v) return;
    update('specs', [...state.specs, { key: k, value: v }]);
    setSpecKey(''); setSpecVal('');
  };
  const removeSpec = idx => update('specs', state.specs.filter((_, i) => i !== idx));

  // In Box
  const addInBox = () => {
    const t = inBoxInput.trim();
    if (!t) return;
    update('inBox', [...state.inBox, t]);
    setInBoxInput('');
  };
  const removeInBox = idx => update('inBox', state.inBox.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'overview' && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 font-semibold">
            Write a clear summary of this product. This appears first on the product page.
          </p>
          <textarea
            rows={5}
            value={state.overview}
            onChange={e => update('overview', e.target.value)}
            placeholder="e.g. The Dell XPS 15 is a premium laptop designed for professionals who demand performance and portability..."
            className={`${inputCls} resize-none`}
          />
          <p className="text-[10px] text-slate-600">{state.overview.length} characters</p>
        </div>
      )}

      {tab === 'features' && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 font-semibold">
            Add standout features shown as bullet points. Press Enter or click Add.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              placeholder="e.g. 12-hour battery life"
              className={inputCls}
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              + Add
            </button>
          </div>
          {state.features.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4 border border-dashed border-slate-800 rounded-xl">
              No features added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {state.features.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 text-xs">✓</span>
                    <span className="text-slate-200 text-sm">{f}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-slate-600 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'specs' && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 font-semibold">
            Add technical specifications as key-value pairs (e.g. Processor → Intel Core i9).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={specKey}
              onChange={e => setSpecKey(e.target.value)}
              placeholder="Spec name (e.g. Processor)"
              className={inputCls}
            />
            <input
              type="text"
              value={specVal}
              onChange={e => setSpecVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())}
              placeholder="Value (e.g. Intel i9-13900H)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={addSpec}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              + Add
            </button>
          </div>
          {state.specs.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4 border border-dashed border-slate-800 rounded-xl">
              No specifications added yet.
            </p>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              {state.specs.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3.5 py-2.5 gap-3 ${i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-500 text-xs font-black uppercase tracking-wider w-28 flex-shrink-0 truncate">{s.key}</span>
                    <span className="text-slate-200 text-sm truncate">{s.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="text-slate-600 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'inBox' && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 font-semibold">
            List everything included in the box. Press Enter or click Add.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inBoxInput}
              onChange={e => setInBoxInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInBox())}
              placeholder="e.g. USB-C Charger (130W)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={addInBox}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              + Add
            </button>
          </div>
          {state.inBox.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4 border border-dashed border-slate-800 rounded-xl">
              No items added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {state.inBox.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">📦</span>
                    <span className="text-slate-200 text-sm">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInBox(i)}
                    className="text-slate-600 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live summary chips */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${state.overview ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
          Overview {state.overview ? '✓' : '—'}
        </span>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${state.features.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
          {state.features.length} Feature{state.features.length !== 1 ? 's' : ''}
        </span>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${state.specs.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
          {state.specs.length} Spec{state.specs.length !== 1 ? 's' : ''}
        </span>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${state.inBox.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
          {state.inBox.length} Box Item{state.inBox.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default DescriptionEditor;

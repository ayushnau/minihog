'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Props {
  event: string;
  from: string;
  to: string;
  filterKey: string;
  filterValue: string;
  onFilterChange: (key: string, value: string) => void;
  /** Compact variant for use inside funnel step rows */
  compact?: boolean;
  /** Pre-loaded schema keys — skips API call when provided */
  schemaKeys?: string[];
  /** Pre-loaded schema values for the selected key — skips API call when provided */
  schemaValues?: string[];
}

export default function PropertyFilter({ event, from, to, filterKey, filterValue, onFilterChange, compact, schemaKeys, schemaValues }: Props) {
  const [keys, setKeys] = useState<string[]>(schemaKeys ?? []);
  const [values, setValues] = useState<string[]>(schemaValues ?? []);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);

  // Load property keys from API only if no schema provided
  useEffect(() => {
    if (schemaKeys) { setKeys(schemaKeys); return; }
    if (!event) return;
    setLoadingKeys(true);
    setKeys([]);
    setValues([]);
    api.getPropertyKeys(event, from, to)
      .then(k => setKeys(k))
      .catch(() => {})
      .finally(() => setLoadingKeys(false));
  }, [event, from, to, schemaKeys?.join(',')]);

  // Load values: use schema if it has entries, otherwise fall back to API sampling
  useEffect(() => {
    if (schemaValues && schemaValues.length > 0) { setValues(schemaValues); return; }
    if (!event || !filterKey) { setValues([]); return; }
    setLoadingValues(true);
    api.getPropertyValues(event, filterKey, from, to)
      .then(v => setValues(v))
      .catch(() => {})
      .finally(() => setLoadingValues(false));
  }, [event, filterKey, from, to, schemaValues?.join(',')]);

  const hasFilter = filterKey && filterValue;

  if (compact) {
    return (
      <div className="mh-row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
        {/* Key picker */}
        <div className="mh-field" style={{ minWidth: 110, fontSize: 11 }}>
          <span className="prompt" style={{ fontSize: 10 }}>key</span>
          {loadingKeys ? (
            <span className="mh-dim mh-loading" style={{ fontSize: 10 }}>…</span>
          ) : keys.length > 0 ? (
            <select value={filterKey} onChange={e => onFilterChange(e.target.value, '')} style={{ fontSize: 11 }}>
              <option value="">— none —</option>
              {keys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          ) : (
            <span className="mh-dim" style={{ fontSize: 10 }}>no props</span>
          )}
        </div>
        {/* Value picker */}
        {filterKey && (
          <div className="mh-field" style={{ minWidth: 110, fontSize: 11 }}>
            <span className="prompt" style={{ fontSize: 10 }}>=</span>
            {loadingValues ? (
              <span className="mh-dim mh-loading" style={{ fontSize: 10 }}>…</span>
            ) : values.length > 0 ? (
              <select value={filterValue} onChange={e => onFilterChange(filterKey, e.target.value)} style={{ fontSize: 11 }}>
                <option value="">— any —</option>
                {values.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={filterValue}
                onChange={e => onFilterChange(filterKey, e.target.value)}
                placeholder="value"
                style={{ fontSize: 11, width: 80 }}
              />
            )}
          </div>
        )}
        {hasFilter && (
          <button
            className="mh-btn ghost sm"
            onClick={() => onFilterChange('', '')}
            style={{ fontSize: 10, padding: '1px 6px', color: 'var(--fg-3)' }}
            title="Clear filter"
          >×</button>
        )}
      </div>
    );
  }

  return (
    <div className="mh-row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span className="mh-dim" style={{ fontSize: 11, letterSpacing: '.08em' }}>where</span>

      {/* Key dropdown */}
      <div className="mh-field" style={{ minWidth: 130 }}>
        <span className="prompt">⌗</span>
        {loadingKeys ? (
          <span className="mh-dim mh-loading" style={{ fontSize: 11 }}>loading</span>
        ) : keys.length > 0 ? (
          <select value={filterKey} onChange={e => onFilterChange(e.target.value, '')}>
            <option value="">— property —</option>
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        ) : (
          <span className="mh-dim" style={{ fontSize: 11 }}>no properties</span>
        )}
      </div>

      {/* Value dropdown — only shown once a key is selected */}
      {filterKey && (
        <>
          <span className="mh-dim" style={{ fontSize: 11 }}>=</span>
          <div className="mh-field" style={{ minWidth: 150 }}>
            <span className="prompt">▸</span>
            {loadingValues ? (
              <span className="mh-dim mh-loading" style={{ fontSize: 11 }}>loading</span>
            ) : values.length > 0 ? (
              <select value={filterValue} onChange={e => onFilterChange(filterKey, e.target.value)}>
                <option value="">— any value —</option>
                {values.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={filterValue}
                onChange={e => onFilterChange(filterKey, e.target.value)}
                placeholder="enter value"
              />
            )}
          </div>
        </>
      )}

      {/* Active filter chip */}
      {hasFilter && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '2px 8px', borderRadius: 'var(--rad)',
          background: 'var(--acc-soft)', border: '1px solid var(--acc-bd)',
          fontSize: 11, color: 'var(--acc)',
        }}>
          <span>{filterKey} = {filterValue}</span>
          <button
            onClick={() => onFilterChange('', '')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--acc)', lineHeight: 1, padding: 0, fontSize: 13 }}
          >×</button>
        </div>
      )}
    </div>
  );
}

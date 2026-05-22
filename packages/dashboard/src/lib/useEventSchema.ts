'use client';

import { useState, useEffect } from 'react';

export interface PropertyDef {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  values?: string[];
}

export interface EventSchemaDef {
  id: string;
  name: string;
  description: string;
  properties: PropertyDef[];
  isStandard?: boolean;
}

const STANDARD_SCHEMAS: EventSchemaDef[] = [
  {
    id: '__page_view',
    name: 'page_view',
    description: 'User visits a page',
    isStandard: true,
    properties: [
      { name: 'page',     type: 'string', description: 'Page path', values: ['/home','/menu','/about','/contact','/reservations'] },
      { name: 'referrer', type: 'string', description: 'Traffic source', values: ['google','instagram','direct','yelp','tripadvisor','twitter','linkedin','github'] },
      { name: 'device',   type: 'string', description: 'Device type',    values: ['desktop','mobile','tablet'] },
      { name: 'country',  type: 'string', description: 'User country',   values: ['US','GB','CA','AU','DE'] },
    ],
  },
  {
    id: '__button_click',
    name: 'button_click',
    description: 'User clicks a button or CTA',
    isStandard: true,
    properties: [
      { name: 'button_id',    type: 'string', description: 'Button identifier',          values: ['reserve-table','order-now','submit-review','apply-coupon'] },
      { name: 'button_label', type: 'string', description: 'Human-readable button label', values: ['Reserve a Table','Order Now','Submit Review'] },
      { name: 'page',         type: 'string', description: 'Page where click occurred',   values: ['/home','/menu','/about','/contact','/reservations'] },
      { name: 'device',       type: 'string', description: 'Device type',                 values: ['desktop','mobile','tablet'] },
    ],
  },
  {
    id: '__signup',
    name: 'signup',
    description: 'User completes registration',
    isStandard: true,
    properties: [
      { name: 'method',   type: 'string', description: 'Signup method', values: ['email','google','github'] },
      { name: 'device',   type: 'string', description: 'Device type',   values: ['desktop','mobile','tablet'] },
      { name: 'country',  type: 'string', description: 'User country' },
      { name: 'referrer', type: 'string', description: 'Traffic source' },
    ],
  },
  {
    id: '__logout',
    name: 'logout',
    description: 'User ends their session',
    isStandard: true,
    properties: [
      { name: 'session_duration_min', type: 'number', description: 'Session length in minutes' },
      { name: 'device',               type: 'string', description: 'Device type', values: ['desktop','mobile','tablet'] },
    ],
  },
  {
    id: '__search',
    name: 'search',
    description: 'User performs a search',
    isStandard: true,
    properties: [
      { name: 'query',         type: 'string', description: 'Search query' },
      { name: 'results_count', type: 'number', description: 'Number of results returned' },
      { name: 'device',        type: 'string', description: 'Device type', values: ['desktop','mobile','tablet'] },
    ],
  },
];

// Module-level cache — fetched once per page load, shared across all hook instances
let cache: EventSchemaDef[] | null = null;
let fetchPromise: Promise<EventSchemaDef[]> | null = null;

async function fetchSchemas(): Promise<EventSchemaDef[]> {
  if (cache) return cache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/event-schema', { credentials: 'include' })
    .then(r => r.json())
    .then(d => {
      const custom: EventSchemaDef[] = d.success ? d.schemas : [];
      cache = [...STANDARD_SCHEMAS, ...custom];
      return cache;
    })
    .catch(() => {
      cache = [...STANDARD_SCHEMAS];
      return cache;
    });

  return fetchPromise;
}

/** Invalidate cache (call after creating/editing/deleting a schema in Settings) */
export function invalidateEventSchemaCache() {
  cache = null;
  fetchPromise = null;
}

export function useEventSchema() {
  const [schemas, setSchemas] = useState<EventSchemaDef[]>(cache ?? STANDARD_SCHEMAS);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) { setSchemas(cache); setLoading(false); return; }
    fetchSchemas().then(s => { setSchemas(s); setLoading(false); });
  }, []);

  const getSchema = (eventName: string): EventSchemaDef | undefined =>
    schemas.find(s => s.name === eventName);

  const getPropertyKeys = (eventName: string): string[] =>
    getSchema(eventName)?.properties.map(p => p.name) ?? [];

  const getPropertyValues = (eventName: string, key: string): string[] =>
    getSchema(eventName)?.properties.find(p => p.name === key)?.values ?? [];

  return { schemas, loading, getSchema, getPropertyKeys, getPropertyValues };
}

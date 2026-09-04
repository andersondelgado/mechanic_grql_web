/**
 * Hooks gRQL — consumen el service layer tipado.
 * Patrón adoptado de Lusiana: los hooks son meros consumidores de servicios,
 * no construyen payloads directamente.
 */
import { useState, useEffect, useCallback } from 'react';
import { getEntity, getEntityById, createEntity, updateEntity, deleteEntity, getPaginatedEntity } from '../api/client';
import type { WorkflowQuery } from '../api/workflow.types';

export interface UseGrqlResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseGrqlListResult<T extends any[]> {
  data: T | null;
  meta: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (item: Record<string, unknown>) => Promise<T[number] | null>;
  update: (id: string, item: Record<string, unknown>) => Promise<T[number] | null>;
  remove: (id: string) => Promise<void>;
}

export function useGrqlList<T extends any[]>(
  table: string,
  query?: WorkflowQuery
): UseGrqlListResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaginatedEntity<T[number]>(table, query);
      setData(result.data as T);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message ?? 'Error al obtener datos');
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(query)]);

  const create = async (item: Record<string, unknown>): Promise<T[number] | null> => {
    const result = await createEntity<T[number]>(table, item);
    if (data && result) setData([...data, result] as T);
    return result;
  };

  const update = async (id: string, item: Record<string, unknown>): Promise<T[number] | null> => {
    const result = await updateEntity<T[number]>(table, id, item);
    if (data && result) setData(data.map((d: any) => (d.id === id ? result : d)) as T);
    return result;
  };

  const remove = async (id: string): Promise<void> => {
    await deleteEntity(table, id);
    if (data) setData(data.filter((d: any) => d.id !== id) as T);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData, create, update, remove };
}

export function useGrqlItem<T>(table: string, id: string): UseGrqlResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await getEntityById<T>(table, id);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Error al obtener item');
    } finally {
      setLoading(false);
    }
  }, [table, id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  return { data, loading, error, refetch: fetchItem };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getApiUrl } from "@/lib/config";

interface UseApiOptions {
  immediate?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  fetcher: (api: string, ...args: unknown[]) => Promise<Response>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate ?? false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(API_URL, ...args);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      return json;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/** Helper: GET request */
export async function apiGet(path: string): Promise<Response> {
  return fetch(`${API_URL}${path}`);
}

/** Helper: POST request */
export async function apiPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Helper: PUT request */
export async function apiPut(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Helper: DELETE request */
export async function apiDelete(path: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, { method: "DELETE" });
}

export { API_URL };

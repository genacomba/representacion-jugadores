import { useCallback, useEffect, useRef, useState } from "react";
import { extractErrorMessage } from "../api/client";

/**
 * Fetches on mount and whenever `deps` change; exposes {data, loading,
 * error, refetch} so pages don't hand-roll the same loading/error dance.
 * `fetcher` should be stable-ish (wrap in useCallback in the caller when it
 * closes over changing values used as deps).
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (id === requestId.current) setData(result);
      })
      .catch((err) => {
        if (id === requestId.current) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load, setData };
}

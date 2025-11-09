import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

type ParseMode = 'json' | 'text' | 'response';

export type AdminApiRequestOptions = RequestInit & {
  parseAs?: ParseMode;
  successMessage?: string;
  errorMessage?: string;
  skipErrorToast?: boolean;
};

export interface AdminApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

async function parseResponse<T>(response: Response, mode: ParseMode): Promise<T> {
  if (mode === 'response') {
    return response as unknown as T;
  }

  if (mode === 'text') {
    return (await response.text()) as T;
  }

  // Default to JSON
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Failed to parse server response');
  }
}

export function useAdminApi() {
  const request = useCallback(
    async <T = unknown>(
      input: RequestInfo | URL,
      { parseAs = 'json', successMessage, errorMessage, skipErrorToast, headers, ...init }: AdminApiRequestOptions = {},
    ): Promise<T> => {
      const isFormData = init?.body instanceof FormData;
      const computedHeaders =
        isFormData || init?.body === undefined
          ? headers
          : {
              'Content-Type': 'application/json',
              ...headers,
            };

      const response = await fetch(input, {
        credentials: 'include',
        ...init,
        headers: computedHeaders,
      });

      const payload = await parseResponse<T | { error?: string }>(response, parseAs);

      if (!response.ok) {
        const message =
          (payload && typeof payload === 'object' && 'error' in payload && payload.error) ||
          errorMessage ||
          `Request failed (${response.status})`;

        if (!skipErrorToast) {
          toast.error(message);
        }

        throw new Error(message);
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      return payload as T;
    },
    [],
  );

  const get = useCallback(
    <T = unknown>(input: RequestInfo | URL, options?: AdminApiRequestOptions) =>
      request<T>(input, { ...options, method: 'GET' }),
    [request],
  );

  const post = useCallback(
    <T = unknown>(input: RequestInfo | URL, body?: unknown, options?: AdminApiRequestOptions) =>
      request<T>(input, {
        ...options,
        method: 'POST',
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      }),
    [request],
  );

  const put = useCallback(
    <T = unknown>(input: RequestInfo | URL, body?: unknown, options?: AdminApiRequestOptions) =>
      request<T>(input, {
        ...options,
        method: 'PUT',
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      }),
    [request],
  );

  const del = useCallback(
    <T = unknown>(input: RequestInfo | URL, options?: AdminApiRequestOptions) =>
      request<T>(input, { ...options, method: 'DELETE' }),
    [request],
  );

  return { request, get, post, put, del };
}

interface UseAdminQueryOptions<T = unknown> {
  enabled?: boolean;
  parseAs?: ParseMode;
  skipErrorToast?: boolean;
  onSuccess?: (data: T) => void;
}

export function useAdminQuery<T = unknown>(url: string | null, options: UseAdminQueryOptions<T> = {}): AdminApiResult<T> {
  const { get } = useAdminApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { enabled = true, parseAs = 'json', skipErrorToast = true, onSuccess } = options;

  const fetchData = useCallback(async () => {
    if (!url || enabled === false) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await get<T>(url, {
        parseAs,
        skipErrorToast,
      });
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [get, url, enabled, parseAs, skipErrorToast, onSuccess]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

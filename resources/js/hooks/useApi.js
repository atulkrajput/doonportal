import { useEffect, useState } from 'react';
import axios from 'axios';
import { api, cleanParams } from '../api/client';

/**
 * GET an API path and track loading / error / data. Re-fetches when the path or
 * params change and cancels stale requests. Pass a null path to skip.
 */
export function useApi(path, params) {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const url = path ? (query ? `${path}?${query}` : path) : null;
    const [state, setState] = useState({ url: null, data: null, error: null });

    useEffect(() => {
        if (!url) {
            return undefined;
        }
        const controller = new AbortController();
        api.get(url, { signal: controller.signal })
            .then((response) => setState({ url, data: response.data, error: null }))
            .catch((error) => {
                if (!axios.isCancel(error)) {
                    setState({ url, data: null, error });
                }
            });
        return () => controller.abort();
    }, [url]);

    const settled = state.url === url;
    return {
        data: settled ? state.data : null,
        error: settled ? state.error : null,
        loading: Boolean(url) && !settled,
    };
}

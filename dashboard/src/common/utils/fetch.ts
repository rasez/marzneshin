
import { FetchOptions, ofetch } from 'ofetch';
import { useAuth } from '@marzneshin/modules/auth';

// Normalize API base URL so that all requests go through `/api`.
// - If VITE_BASE_API is absolute (e.g. http://host:8000 or http://host:8000/api/),
//   we ensure it ends with `/api`.
// - If it's relative or missing, we default to `/api`.
const rawBaseApi = import.meta.env.VITE_BASE_API || '/api/';

const normalizeBaseApi = (base: string): string => {
    const trimmed = base.replace(/\/+$/, ''); // drop trailing slashes
    if (trimmed.endsWith('/api')) {
        return trimmed;
    }
    return `${trimmed}/api`;
};

export const $fetch = ofetch.create({
    baseURL: normalizeBaseApi(rawBaseApi),
});

export const fetcher = <T = any>(
    url: string,
    ops: FetchOptions<'json'> = {}
) => {
    const token = useAuth.getState().getAuthToken();
    if (token) {
        ops['headers'] = {
            ...(ops?.headers || {}),
            Authorization: `Bearer ${token}`,
        };
    }
    return $fetch<T>(url, ops);
};

export const fetch = fetcher;

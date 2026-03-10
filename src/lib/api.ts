const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

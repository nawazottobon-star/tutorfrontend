const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

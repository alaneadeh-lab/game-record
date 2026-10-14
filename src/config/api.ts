/**
 * Resolve the backend API base URL for web and native shells.
 *
 * Native builds cannot reach the developer's localhost, so mobile packages
 * should set VITE_API_URL to a publicly reachable API (for example the
 * production Render/Railway URL) when cloud sync is required.
 */
export function getApiBaseUrl(): string | undefined {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return undefined;
}

export function getApiBaseUrlOrDefault(): string {
  return getApiBaseUrl() ?? 'http://localhost:5201/api';
}

export function isCloudStorageEnabled(): boolean {
  return getApiBaseUrl() !== undefined;
}

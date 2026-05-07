/**
 * Converts stored image URLs to work in production.
 * Images saved as http://localhost:5000/uploads/... become /uploads/...
 * so Next.js rewrites can proxy them to the real backend.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/localhost:\d+/, '');
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Use relative URL by default so Next.js rewrites proxy the request
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // If no base URL is defined, default to /api for local development/proxies
  if (!baseUrl) {
    baseUrl = '/api';
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('verdant_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  // Handle empty responses (like 204 No Content for DELETE)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

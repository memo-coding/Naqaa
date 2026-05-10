/**
 * Converts stored image URLs to work in production.
 * Images saved as http://localhost:5000/uploads/... become /uploads/...
 * so Next.js rewrites can proxy them to the real backend.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }
  
  // Normalize localhost/127.0.0.1 to relative path
  let cleaned = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/, '');
  
  // If it's a relative path (doesn't start with http/https), ensure it starts with /
  if (!cleaned.startsWith('http') && !cleaned.startsWith('/') && !cleaned.startsWith('data:')) {
    cleaned = '/' + cleaned;
  }
  
  if (cleaned.startsWith('/')) {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (baseUrl) {
      baseUrl = baseUrl.replace(/\/api\/?$/, '');
      if (baseUrl) {
        return baseUrl + cleaned;
      }
    }
  }
  
  return cleaned;
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
    const token = localStorage.getItem('naqaa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    cache: 'no-store', // Disable caching for all API calls
    ...options,
    headers,
  }).catch(err => {
    console.error('Fetch error:', err);
    throw new Error('Network error: Unable to reach server');
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Not JSON or other error
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content for DELETE)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function uploadFile(file: File) {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  if (!baseUrl) baseUrl = '/api';

  const formData = new FormData();
  formData.append('image', file);

  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('naqaa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Upload failed');
  }

  return response.json();
}

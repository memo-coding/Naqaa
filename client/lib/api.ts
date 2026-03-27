export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Use relative URL by default so Next.js rewrites proxy the request
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
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

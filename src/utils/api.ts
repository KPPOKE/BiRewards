export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://birewards.id/api');

/**
 * Makes an authenticated API request
 * @param endpoint - API endpoint (without the base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  // Debug logging to track API calls
  const fullUrl = `${API_URL}${endpoint}`;
  console.log('🔍 API Request Debug:', {
    endpoint,
    fullUrl,
    method: options.method || 'GET',
    hasToken: !!token
  });
  
  // Check for suspicious URLs with user IDs
  if (endpoint.match(/\/(rewards|redeem-requests|support-tickets)\/\d+$/)) {
    console.warn('⚠️ Suspicious API call detected:', fullUrl);
    console.trace('Call stack:');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * GET request helper (allows optional RequestInit for custom headers, etc.)
 */
export const get = (endpoint: string, options: RequestInit = {}) => 
  apiRequest(endpoint, { ...options, method: options.method ?? 'GET' });

/**
 * POST request helper (allows additional RequestInit such as custom headers)
 */
export const post = <T>(endpoint: string, data: T, options: RequestInit = {}) => 
  apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });

/**
 * PUT request helper
 */
export const put = <T>(endpoint: string, data: T, options: RequestInit = {}) => 
  apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });

/**
 * PATCH request helper
 */
export const patch = <T>(endpoint: string, data: T, options: RequestInit = {}) =>
  apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });

/**
 * DELETE request helper
 */
export const del = (endpoint: string, options: RequestInit = {}) => 
  apiRequest(endpoint, {
    method: 'DELETE',
    ...options
  });

export default {
  get,
  post,
  put,
  patch,
  delete: del
};

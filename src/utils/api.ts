// API utility functions for consistent API calls with authentication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Makes an authenticated API request
 * @param endpoint - API endpoint (without the base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
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
 * GET request helper
 */
export const get = (endpoint: string) => 
  apiRequest(endpoint);

/**
 * POST request helper
 */
export const post = (endpoint: string, data: any) => 
  apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });

/**
 * PUT request helper
 */
export const put = (endpoint: string, data: any) => 
  apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

/**
 * DELETE request helper
 */
export const del = (endpoint: string) => 
  apiRequest(endpoint, {
    method: 'DELETE'
  });

export default {
  get,
  post,
  put,
  delete: del
};

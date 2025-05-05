import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for making API requests with authentication and error handling
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  /**
   * Make an authenticated API request
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Fetch options (method, body, etc.)
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - The response data
   */
  const request = useCallback(async (url, options = {}, requiresAuth = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add authorization header if required and user is logged in
      if (requiresAuth && user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          // Try to parse as JSON anyway
          data = JSON.parse(text);
        } catch (e) {
          // If it's not JSON, return as text
          data = { message: text };
        }
      }
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          if (requiresAuth && user) {
            // Token might be expired or invalid
            logout();
          }
        }
        
        throw new Error(data.error || data.message || 'An unexpected error occurred');
      }
      
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
      throw err;
    }
  }, [user, logout]);
  
  /**
   * Reset the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    request,
    loading,
    error,
    clearError,
  };
};
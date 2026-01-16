/**
 * Utility Functions
 */

/**
 * Format cents as currency string
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency (e.g., "$1.50")
 */
export function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generate random client seed
 * @returns {string} Random seed string
 */
export function generateClientSeed() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * API base URL
 * - Development: localhost:5000
 * - Production: from environment or relative path
 */
export const API_BASE_URL = (() => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  return import.meta.env.VITE_API_URL || '';
})();

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

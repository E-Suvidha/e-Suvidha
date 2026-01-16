// Centralized API base helper with authentication support.
// Configure the backend base URL through NEXT_PUBLIC_API_URL in Vercel or your .env.local.
// In development we default to localhost:5000 to make Next server-side fetches reach the local backend.
// In production we require NEXT_PUBLIC_API_URL (or rely on same-origin if you proxy).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '');

export default function api(path = '') {
  if (!path) return API_BASE;
  
  // Remove leading slash if present to avoid double slashes
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  // If path already starts with 'api/', remove it to avoid double 'api'
  if (path.startsWith('api/')) {
    path = path.substring(4);
  }
  
  return API_BASE ? `${API_BASE}/${path}` : `/${path}`;
}

// Helper function to create authenticated API requests
export function createAuthenticatedRequest(token) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
}

// Helper function for authenticated API calls
export async function authenticatedApiCall(path, options = {}, token) {
  const url = api(path);
  const requestOptions = {
    ...options,
    headers: {
      ...createAuthenticatedRequest(token).headers,
      ...options.headers
    }
  };
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch agent recommendations with hybrid scoring
 * 
 * THINKING PHASE: Backend computes preference boost from memory
 * ACTION PHASE: Returns ranked tenders with agent metadata
 */
export async function getAgentRecommendations(token) {
  try {
    const url = api('recommendations');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch agent recommendations: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agent recommendations:', error);
    return null;
  }
}

/**
 * Fetch agent memory profile for current user
 * Shows which categories/skills agent has learned
 */
export async function getAgentMemory(token) {
  try {
    const url = api('agent-memory');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch agent memory: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agent memory:', error);
    return null;
  }
}

/**
 * Submit feedback on a recommendation
 * Helps improve agent adaptation over time
 */
export async function rateRecommendation(tenderId, rating, feedback, token) {
  try {
    const url = api('recommendations/rate');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenderId,
        rating,
        feedback
      })
    });

    if (!response.ok) {
      console.warn(`Failed to rate recommendation: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error rating recommendation:', error);
    return null;
  }
}

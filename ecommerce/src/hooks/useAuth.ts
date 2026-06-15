// ─── useAuth.ts ───────────────────────────────────────────────────────────────
// Shared auth helpers: token refresh + authenticated fetch

export function useAuth() {
  // Helper to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) return null;
      const response = await fetch('https://basicsbox.pythonanywhere.com/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      const data = await response.json();
      if (response.ok && data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        window.location.href = '/customer';
        return null;
      }
    } catch { return null; }
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // Get current token
    let token = localStorage.getItem('access_token');
    
    // Check if token exists and is expired
    if (token && isTokenExpired(token)) {
      const newToken = await refreshToken();
      if (newToken) {
        token = newToken;
      } else {
        throw new Error('Unable to refresh token');
      }
    }
    
    // Make request with valid token
    let response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    
    // If still 401, try one more refresh
    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        response = await fetch(url, {
          ...options,
          headers: { ...options.headers, 'Authorization': `Bearer ${newToken}`, 'Content-Type': 'application/json' },
        });
      }
    }
    
    return response;
  };

  return { refreshToken, authenticatedFetch, isTokenExpired };
}
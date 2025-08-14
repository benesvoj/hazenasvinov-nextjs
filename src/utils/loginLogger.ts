export interface LoginLogData {
  email: string;
  status: 'success' | 'failed';
  action: 'login' | 'logout';
  reason?: string;
  userAgent?: string;
}

/**
 * Logs a login/logout action via the API endpoint
 * @param data Login/logout action data
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 */
export async function logLoginAction(data: LoginLogData): Promise<boolean> {
  try {
    // Only log in production environments
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    
    if (!isProduction || isLocalhost) {
      console.log(`[DEV] Login action would be logged: ${data.email} - ${data.action} - ${data.status} (skipped in development)`);
      return true; // Return success to avoid breaking functionality
    }

    const userAgent = data.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown');
    
    const response = await fetch('/api/log-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        status: data.status,
        action: data.action,
        reason: data.reason,
        userAgent: userAgent
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to log login action:', errorData);
      return false;
    }

    console.log(`Login action logged: ${data.email} - ${data.action} - ${data.status}`);
    return true;
  } catch (error) {
    console.error('Error logging login action:', error);
    return false;
  }
}

/**
 * Logs a successful login
 * @param email User's email
 * @param userAgent User agent string
 * @returns Promise<boolean>
 */
export async function logSuccessfulLogin(email: string, userAgent?: string): Promise<boolean> {
  return logLoginAction({
    email,
    status: 'success',
    action: 'login',
    userAgent
  });
}

/**
 * Logs a failed login attempt
 * @param email User's email
 * @param reason Reason for failure
 * @param userAgent User agent string
 * @returns Promise<boolean>
 */
export async function logFailedLogin(email: string, reason: string, userAgent?: string): Promise<boolean> {
  return logLoginAction({
    email,
    status: 'failed',
    action: 'login',
    reason,
    userAgent
  });
}

/**
 * Logs a logout action
 * @param email User's email
 * @param userAgent User agent string
 * @returns Promise<boolean>
 */
export async function logLogout(email: string, userAgent?: string): Promise<boolean> {
  return logLoginAction({
    email,
    status: 'success',
    action: 'logout',
    userAgent
  });
}

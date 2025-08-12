export interface LoginLogData {
  email: string;
  status: 'success' | 'failed';
  reason?: string;
  userAgent?: string;
}

/**
 * Logs a login attempt via the API endpoint
 * @param data Login attempt data
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 */
export async function logLoginAttempt(data: LoginLogData): Promise<boolean> {
  try {
    const userAgent = data.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown');
    
    const response = await fetch('/api/log-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        status: data.status,
        reason: data.reason,
        userAgent: userAgent
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to log login attempt:', errorData);
      return false;
    }

    console.log(`Login attempt logged: ${data.email} - ${data.status}`);
    return true;
  } catch (error) {
    console.error('Error logging login attempt:', error);
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
  return logLoginAttempt({
    email,
    status: 'success',
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
  return logLoginAttempt({
    email,
    status: 'failed',
    reason,
    userAgent
  });
}

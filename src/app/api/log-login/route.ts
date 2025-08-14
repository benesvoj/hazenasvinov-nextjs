import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, status, reason, userAgent, action = 'login' } = body;

    // Validate required fields
    if (!email || !status || !action) {
      return NextResponse.json(
        { error: 'Email, status, and action are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['success', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "success" or "failed"' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['login', 'logout'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "login" or "logout"' },
        { status: 400 }
      );
    }

    // Only log in production environments
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                       request.headers.get('host')?.includes('127.0.0.1') ||
                       process.env.NODE_ENV === 'development';

    if (!isProduction || isLocalhost) {
      // In development/localhost, just return success without logging
      console.log(`[DEV] Login action would be logged: ${email} - ${action} - ${status} (skipped in development)`);
      return NextResponse.json({ 
        success: true, 
        message: 'Login action logged successfully (development mode - no database logging)' 
      });
    }

    // Check for recent duplicate login attempts (within 10 seconds)
    const supabase = await createClient();
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    
    const { data: recentLogs } = await supabase
      .from('login_logs')
      .select('id')
      .eq('email', email)
      .eq('action', action)
      .eq('status', status)
      .gte('created_at', tenSecondsAgo)
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      console.log(`[API] Duplicate login attempt detected for ${email}, skipping`);
      return NextResponse.json({ 
        success: true, 
        message: 'Login action already logged recently' 
      });
    }

    // Get user agent
    const userAgentHeader = request.headers.get('user-agent') || userAgent || 'Unknown';

    // Log to database using server-side client (without IP address for privacy)
    const { error } = await supabase
      .from('login_logs')
      .insert({
        email,
        status,
        action,
        user_agent: userAgentHeader,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log login attempt:', error);
      return NextResponse.json(
        { error: 'Failed to log login attempt', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Login action logged: ${email} - ${action} - ${status}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Login action logged successfully' 
    });

  } catch (error) {
    console.error('Error in log-login API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

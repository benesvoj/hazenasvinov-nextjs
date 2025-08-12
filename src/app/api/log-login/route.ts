import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, status, reason, userAgent } = body;

    // Validate required fields
    if (!email || !status) {
      return NextResponse.json(
        { error: 'Email and status are required' },
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

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'Unknown';

    // Get user agent
    const userAgentHeader = request.headers.get('user-agent') || userAgent || 'Unknown';

    // Log to database
    const supabase = createClient();
    const { error } = await supabase
      .from('login_logs')
      .insert({
        email,
        status,
        ip_address: ip,
        user_agent: userAgentHeader,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log login attempt:', error);
      return NextResponse.json(
        { error: 'Failed to log login attempt' },
        { status: 500 }
      );
    }

    console.log(`Login attempt logged: ${email} - ${status} from ${ip}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Login attempt logged successfully' 
    });

  } catch (error) {
    console.error('Error in log-login API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

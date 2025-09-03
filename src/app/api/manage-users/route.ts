import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userData, userId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    switch (action) {
      case 'update':
        if (!userId || !userData) {
          return NextResponse.json(
            { error: 'User ID and user data are required for update' },
            { status: 400 }
          );
        }

        console.log('Updating user:', { userId, userData });

        // For existing users, only update metadata, not email
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: userData.full_name,
            phone: userData.phone,
            bio: userData.bio,
            position: userData.position
          }
        });

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
        break;

      case 'create':
        if (!userData?.email) {
          return NextResponse.json(
            { error: 'Email is required for user creation' },
            { status: 400 }
          );
        }

        console.log('Creating user:', { userData });

        const { data: createData, error: createError } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            bio: userData.bio,
            position: userData.position
          }
        });

        if (createError) {
          console.error('Create error:', createError);
          throw createError;
        }

        return NextResponse.json({ 
          success: true, 
          message: 'User created successfully',
          userId: createData.user?.id,
          userEmail: createData.user?.email
        });

      case 'toggleBlock':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for blocking/unblocking' },
            { status: 400 }
          );
        }

        console.log('Toggling block for user:', { userId });

        // First get current user metadata
        const { data: currentUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);
        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        const currentMetadata = currentUser.user?.user_metadata || {};
        const isBlocked = currentMetadata.is_blocked;

        const { error: blockError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...currentMetadata,
            is_blocked: !isBlocked
          }
        });

        if (blockError) {
          console.error('Block error:', blockError);
          throw blockError;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${action} completed successfully` 
    });

  } catch (error) {
    console.error('Error in manage-users API:', error);
    return NextResponse.json(
      { error: 'Failed to manage user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

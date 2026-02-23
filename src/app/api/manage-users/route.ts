import {NextRequest, NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';

import {getDefaultRoleId} from '@/queries/roleDefinitions/queries';

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
    const {action, userData, userId} = body;

    if (!action) {
      return NextResponse.json({error: 'Action is required'}, {status: 400});
    }

    switch (action) {
      case 'update':
        if (!userId || !userData) {
          return NextResponse.json(
            {error: 'User ID and user data are required for update'},
            {status: 400}
          );
        }

        // For existing users, only update metadata, not email
        const {error: updateError} = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: userData.full_name,
            phone: userData.phone,
            bio: userData.bio,
            position: userData.position,
          },
        });

        if (updateError) {
          throw updateError;
        }
        break;

      case 'create':
        if (!userData?.email) {
          return NextResponse.json({error: 'Email is required for user creation'}, {status: 400});
        }

        // Create user directly with admin privileges
        console.log('Creating user with data:', {
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          bio: userData.bio,
          position: userData.position,
        });

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          return NextResponse.json(
            {
              error: 'Neplatný formát emailu',
            },
            {status: 400}
          );
        }

        // Check if user already exists by listing users and filtering by email
        const {data: allUsers, error: checkError} = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = allUsers?.users?.find((user) => user.email === userData.email);
        if (existingUser) {
          return NextResponse.json(
            {
              error: 'Uživatel s tímto emailem již existuje',
            },
            {status: 409}
          );
        }

        // Test Supabase connection first
        console.log('Testing Supabase connection...');
        const {data: testData, error: testError} = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        if (testError) {
          console.error('Supabase connection test failed:', testError);
          return NextResponse.json(
            {
              error: 'Supabase connection failed',
              details: testError.message,
              code: testError.code,
            },
            {status: 500}
          );
        }

        console.log(
          'Supabase connection successful, existing users:',
          testData?.users?.length || 0
        );

        // Check if there are any database constraints or issues
        console.log('Checking database configuration...');
        const {data: dbInfo, error: dbError} = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(5);

        if (dbError) {
          console.warn('Could not check database info:', dbError.message);
        } else {
          console.log('Database tables accessible:', dbInfo?.length || 0);
        }

        // Try creating user with inviteUserByEmail (invitation flow)
        console.log('Attempting user creation with inviteUserByEmail:', userData.email);

        const {data: createData, error: createError} =
          await supabaseAdmin.auth.admin.inviteUserByEmail(userData.email, {
            data: {
              full_name: userData.full_name || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              position: userData.position || '',
            },
          });

        const {data: defaultRoleId, error} = await getDefaultRoleId(
          {
            supabase: supabaseAdmin,
          },
          'member'
        );
        if (error || !defaultRoleId) {
          console.error('Failed to fetch default role ID:', error);
          return NextResponse.json(
            {error: 'Server configuration error - default role not found'},
            {status: 500}
          );
        }
        const {error: profileError} = await supabaseAdmin.from('user_profiles').insert({
          user_id: userId,
          role_id: defaultRoleId,
          // Legacy compatibility, remove in future
          role: 'member',
          assigned_categories: null,
        });

        if (profileError) {
          console.error('Failed to create user profile:', profileError);
        }

        if (createError) {
          console.error('Supabase inviteUserByEmail error:', createError);
          console.error('Error details:', {
            message: createError.message,
            code: createError.code,
            status: createError.status,
          });

          // Handle specific error cases
          if (
            createError.message?.includes('User already registered') ||
            createError.message?.includes('already exists')
          ) {
            return NextResponse.json(
              {
                error: 'Uživatel s tímto emailem již existuje',
              },
              {status: 409}
            );
          }

          if (createError.message?.includes('Invalid email')) {
            return NextResponse.json(
              {
                error: 'Neplatný email',
              },
              {status: 400}
            );
          }

          // Return more specific error with guidance
          return NextResponse.json(
            {
              error: 'Nepodařilo se pozvat uživatele - problém s konfigurací databáze',
              details:
                'Zkuste vytvořit uživatele ručně přes Supabase dashboard a pak ho upravit zde.',
              code: createError.code,
              guidance:
                'Pro vytvoření uživatele jděte do Supabase Dashboard → Authentication → Users → Add User',
            },
            {status: 500}
          );
        }

        // If user invitation successful, the metadata is already set via data parameter
        console.log('User invitation sent successfully');
        console.log('User data:', createData);

        return NextResponse.json({
          success: true,
          message: 'Pozvánka byla úspěšně odeslána',
          userId: createData.user?.id,
          userEmail: createData.user?.email,
        });

      case 'toggleBlock':
        if (!userId) {
          return NextResponse.json(
            {error: 'User ID is required for blocking/unblocking'},
            {status: 400}
          );
        }

        // First get current user metadata
        const {data: currentUser, error: fetchError} =
          await supabaseAdmin.auth.admin.getUserById(userId);
        if (fetchError) {
          throw fetchError;
        }

        const currentMetadata = currentUser.user?.user_metadata || {};
        const isBlocked = currentMetadata.is_blocked;

        const {error: blockError} = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...currentMetadata,
            is_blocked: !isBlocked,
          },
        });

        if (blockError) {
          throw blockError;
        }
        break;

      default:
        return NextResponse.json({error: 'Invalid action'}, {status: 400});
    }

    return NextResponse.json({
      success: true,
      message: `User ${action} completed successfully`,
    });
  } catch (error) {
    console.error('Error in manage-users API:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage user',
        details: error instanceof Error ? error.message : 'Unknown error',
        action: body?.action || 'unknown',
      },
      {status: 500}
    );
  }
}

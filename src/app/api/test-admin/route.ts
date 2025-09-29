import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing admin permissions...');

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: 'Service role key not found',
          hasServiceRole: false,
        },
        {status: 500}
      );
    }

    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Supabase client created with service role key');

    // Test 1: List users (basic admin operation)
    const {data: usersResponse, error: listError} = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('List users error:', listError);
      return NextResponse.json(
        {
          error: 'Cannot list users',
          details: listError.message,
          code: listError.status,
          hasServiceRole: true,
          canListUsers: false,
        },
        {status: 500}
      );
    }

    const users = usersResponse?.users || [];
    console.log('Successfully listed users:', users.length);
    console.log('Users data type:', typeof users, 'Users value:', users);

    // If no users exist, create a test user
    if (!users || users.length === 0) {
      console.log('No users found, creating test user...');

      try {
        const {data: newUser, error: createError} = await supabase.auth.admin.createUser({
          email: 'test@example.com',
          password: 'testpassword123',
          email_confirm: true,
          user_metadata: {
            full_name: 'Test User',
            position: 'Administrator',
            is_blocked: false,
          },
        });

        if (createError) {
          console.error('Create test user error:', createError);
          return NextResponse.json(
            {
              error: 'Cannot create test user',
              details: createError.message,
              code: createError.status,
              hasServiceRole: true,
              canListUsers: true,
              canCreateUser: false,
              createError: createError,
            },
            {status: 500}
          );
        }

        if (!newUser.user) {
          console.error('No user data returned from creation');
          return NextResponse.json(
            {
              error: 'User creation returned no data',
              hasServiceRole: true,
              canListUsers: true,
              canCreateUser: false,
            },
            {status: 500}
          );
        }

        console.log('Test user created successfully:', newUser.user.email);

        return NextResponse.json({
          success: true,
          hasServiceRole: true,
          canListUsers: true,
          canCreateUser: true,
          userCount: 1,
          testUser: {
            id: newUser.user.id,
            email: newUser.user.email,
            metadata: newUser.user.user_metadata,
          },
          message: 'Test user created successfully',
        });
      } catch (createException) {
        console.error('Exception during user creation:', createException);
        return NextResponse.json(
          {
            error: 'Exception during user creation',
            details:
              createException instanceof Error ? createException.message : 'Unknown exception',
            hasServiceRole: true,
            canListUsers: true,
            canCreateUser: false,
          },
          {status: 500}
        );
      }
    }

    // Test 2: Get a specific user if available
    if (users && users.length > 0) {
      const testUser = users[0];
      const {data: user, error: getUserError} = await supabase.auth.admin.getUserById(testUser.id);

      if (getUserError) {
        console.error('Get user error:', getUserError);
        return NextResponse.json(
          {
            error: 'Cannot get specific user',
            details: getUserError.message,
            code: getUserError.status,
            hasServiceRole: true,
            canListUsers: true,
            canGetUser: false,
          },
          {status: 500}
        );
      }

      console.log('Successfully got user:', user.user?.email);

      return NextResponse.json({
        success: true,
        hasServiceRole: true,
        canListUsers: true,
        canGetUser: true,
        userCount: users.length,
        testUser: {
          id: user.user?.id,
          email: user.user?.email,
          metadata: user.user?.user_metadata,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasServiceRole: true,
      canListUsers: true,
      canGetUser: true,
      userCount: 0,
    });
  } catch (error) {
    console.error('Test admin error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}

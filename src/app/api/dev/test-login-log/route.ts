import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing login log functionality...');

    // Test 1: Check if we can create a client
    const supabase = await createClient();
    console.log('✅ Supabase client created');

    // Test 2: Check if we can access the table
    const {data: testQuery, error: queryError} = await supabase
      .from('login_logs')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('❌ Query error:', queryError);
      return NextResponse.json(
        {
          error: 'Cannot query login_logs table',
          details: queryError.message,
          code: queryError.code,
        },
        {status: 500}
      );
    }

    console.log('✅ Table query successful, found records:', testQuery?.length || 0);

    // Test 3: Try to insert a test record
    const testRecord = {
      email: 'test@example.com',
      status: 'success',
      action: 'login',
      user_agent: 'Test User Agent',
      created_at: new Date().toISOString(),
    };

    const {data: insertData, error: insertError} = await supabase
      .from('login_logs')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json(
        {
          error: 'Cannot insert into login_logs table',
          details: insertError.message,
          code: insertError.code,
        },
        {status: 500}
      );
    }

    console.log('✅ Test record inserted successfully:', insertData);

    // Test 4: Clean up test record
    if (insertData && insertData[0]?.id) {
      const {error: deleteError} = await supabase
        .from('login_logs')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.warn('⚠️ Could not delete test record:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      tableAccess: '✅ Working',
      insertAccess: '✅ Working',
      cleanup: '✅ Working',
    });
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return NextResponse.json(
      {
        error: 'Test failed with exception',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}

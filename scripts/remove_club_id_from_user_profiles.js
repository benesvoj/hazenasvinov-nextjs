// Remove club_id field from user_profiles table and update related code
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth: {autoRefreshToken: false, persistSession: false}}
);

async function removeClubIdFromUserProfiles() {
  try {
    console.log('🔧 Removing club_id field from user_profiles table...');

    // 1. Check current structure
    console.log('1. Checking current user_profiles structure...');
    const {data: columns, error: columnsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (columnsError) {
      console.error('Error checking columns:', columnsError.message);
      return;
    }

    console.log('Current user_profiles columns:');
    if (Array.isArray(columns)) {
      columns.forEach((col) => console.log(`  - ${col.column_name}: ${col.data_type}`));
    }

    // 2. Remove club_id column
    console.log('\n2. Removing club_id column...');
    const {data: removeColumn, error: removeError} = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_profiles DROP COLUMN IF EXISTS club_id;
      `,
    });

    if (removeError) {
      console.error('Error removing club_id column:', removeError.message);
    } else {
      console.log('✅ club_id column removed successfully');
    }

    // 3. Remove club_id from profiles table too
    console.log('\n3. Removing club_id from profiles table...');
    const {data: removeProfilesColumn, error: removeProfilesError} = await supabase.rpc(
      'exec_sql',
      {
        sql: `
        ALTER TABLE profiles DROP COLUMN IF EXISTS club_id;
      `,
      }
    );

    if (removeProfilesError) {
      console.error('Error removing club_id from profiles:', removeProfilesError.message);
    } else {
      console.log('✅ club_id column removed from profiles table');
    }

    // 4. Remove club_id indexes
    console.log('\n4. Removing club_id indexes...');
    const {data: removeIndexes, error: indexError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP INDEX IF EXISTS profiles_club_id_idx;
      `,
    });

    if (indexError) {
      console.error('Error removing indexes:', indexError.message);
    } else {
      console.log('✅ club_id indexes removed');
    }

    // 5. Verify the changes
    console.log('\n5. Verifying changes...');
    const {data: newColumns, error: verifyError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (verifyError) {
      console.error('Error verifying changes:', verifyError.message);
    } else {
      console.log('Updated user_profiles columns:');
      if (Array.isArray(newColumns)) {
        newColumns.forEach((col) => console.log(`  - ${col.column_name}: ${col.data_type}`));
      }
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Removed club_id column from user_profiles table');
    console.log('✅ Removed club_id column from profiles table');
    console.log('✅ Removed related indexes');
    console.log('\n📝 Next steps:');
    console.log('1. Update UserContext.tsx to remove club_id references');
    console.log('2. Update UserProfile interface to remove club_id');
    console.log('3. Update any other code that references user_profiles.club_id');
  } catch (error) {
    console.error('❌ Error removing club_id:', error);
  }
}

removeClubIdFromUserProfiles();

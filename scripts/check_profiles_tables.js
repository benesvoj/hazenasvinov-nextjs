// Check for profiles tables and create compatibility layer
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkProfilesTables() {
  try {
    console.log('🔍 Checking for profiles tables...');

    // 1. Check all tables with "profile" in the name
    const {data: profileTables, error: profileError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name, 
          table_schema,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%profile%'
        ORDER BY table_name;
      `,
    });

    if (profileError) {
      console.error('Error checking profile tables:', profileError.message);
    } else {
      console.log('Tables with "profile" in name:');
      if (Array.isArray(profileTables)) {
        profileTables.forEach((table) => {
          console.log(`- ${table.table_schema}.${table.table_name} (${table.table_type})`);
        });
      } else {
        console.log('No profile tables found');
      }
    }

    // 2. Check if there's a "profiles" table specifically
    const {data: profilesTable, error: profilesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
        );
      `,
    });

    if (profilesError) {
      console.error('Error checking profiles table:', profilesError.message);
    } else {
      console.log('Profiles table exists:', profilesTable);
    }

    // 3. If profiles table exists, get its structure
    if (profilesTable && profilesTable[0]?.exists) {
      console.log('3. Getting profiles table structure...');
      const {data: profilesStructure, error: structureError} = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
          ORDER BY ordinal_position;
        `,
      });

      if (structureError) {
        console.error('Error getting profiles structure:', structureError.message);
      } else {
        console.log('Profiles table structure:');
        if (Array.isArray(profilesStructure)) {
          profilesStructure.forEach((col) => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
          });
        }
      }
    }

    // 4. Check user_profiles table structure
    console.log('4. Getting user_profiles table structure...');
    const {data: userProfilesStructure, error: userProfilesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
        ORDER BY ordinal_position;
      `,
    });

    if (userProfilesError) {
      console.error('Error getting user_profiles structure:', userProfilesError.message);
    } else {
      console.log('User_profiles table structure:');
      if (Array.isArray(userProfilesStructure)) {
        userProfilesStructure.forEach((col) => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

checkProfilesTables();

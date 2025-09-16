// Check user_profiles table schema and foreign keys
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth: {autoRefreshToken: false, persistSession: false}}
);

async function checkSchema() {
  try {
    console.log('🔍 Checking user_profiles table structure...');
    const {data, error} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('user_profiles columns:');
      if (Array.isArray(data)) {
        data.forEach((col) =>
          console.log(
            `  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`
          )
        );
      } else {
        console.log('No data returned or not an array:', data);
      }
    }

    console.log('\n🔍 Checking foreign key constraints...');
    const {data: fks, error: fkError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'user_profiles';
      `,
    });

    if (fkError) {
      console.error('FK Error:', fkError.message);
    } else {
      console.log('Foreign keys on user_profiles:');
      if (Array.isArray(fks)) {
        fks.forEach((fk) =>
          console.log(`  ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`)
        );
      } else {
        console.log('No foreign keys found or not an array:', fks);
      }
    }

    console.log('\n🔍 Checking if clubs table exists...');
    const {data: clubsCheck, error: clubsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'clubs'
        );
      `,
    });

    if (clubsError) {
      console.error('Clubs check error:', clubsError.message);
    } else {
      console.log('Clubs table exists:', clubsCheck);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkSchema();

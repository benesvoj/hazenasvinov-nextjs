#!/usr/bin/env node

/**
 * Setup script for the page visibility system
 * This script helps create the page_visibility table and populate it with initial data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupPageVisibility() {
  console.log('🚀 Setting up page visibility system...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('page_visibility')
      .select('count')
      .limit(1);

    if (existingTable && existingTable.length > 0) {
      console.log('✅ Page visibility table already exists and has data');
      console.log('   Skipping table creation...\n');
    } else {
      console.log('📋 Creating page_visibility table...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create page visibility table
          CREATE TABLE IF NOT EXISTS page_visibility (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            page_key VARCHAR(100) UNIQUE NOT NULL,
            page_title VARCHAR(255) NOT NULL,
            page_route VARCHAR(255) NOT NULL,
            page_description TEXT,
            is_visible BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            category VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_page_visibility_visible ON page_visibility(is_visible);
          CREATE INDEX IF NOT EXISTS idx_page_visibility_category ON page_visibility(category);
          CREATE INDEX IF NOT EXISTS idx_page_visibility_sort_order ON page_visibility(sort_order);
          CREATE INDEX IF NOT EXISTS idx_page_visibility_active ON page_visibility(is_active);
        `
      });

      if (createError) {
        console.error('❌ Error creating table:', createError.message);
        console.log('\n💡 You may need to run the SQL script manually in your Supabase dashboard');
        console.log('   File: scripts/create_page_visibility_table.sql');
        process.exit(1);
      }

      console.log('✅ Table created successfully\n');
    }

    // Insert default data
    console.log('📝 Inserting default page configurations...');
    
    const defaultPages = [
      { page_key: 'home', page_title: 'Úvod', page_route: '/', page_description: 'Hlavní stránka klubu', is_visible: true, sort_order: 1, category: 'main' },
      { page_key: 'categories', page_title: 'Kategorie', page_route: '/categories', page_description: 'Všechny kategorie týmů', is_visible: true, sort_order: 2, category: 'main' },
      { page_key: 'blog', page_title: 'Novinky', page_route: '/blog', page_description: 'Blogové články a novinky', is_visible: true, sort_order: 3, category: 'main' },
      { page_key: 'matches', page_title: 'Zápasy', page_route: '/matches', page_description: 'Harmonogram a výsledky zápasů', is_visible: true, sort_order: 4, category: 'main' },
      { page_key: 'photoGallery', page_title: 'Fotogalerie', page_route: '/photo-gallery', page_description: 'Fotografie ze zápasů a akcí', is_visible: true, sort_order: 5, category: 'main' },
      { page_key: 'chronicle', page_title: 'Kronika', page_route: '/chronicle', page_description: 'Historie klubu', is_visible: true, sort_order: 6, category: 'info' },
      { page_key: 'downloads', page_title: 'Dokumenty', page_route: '/downloads', page_description: 'Ke stažení dokumenty', is_visible: true, sort_order: 7, category: 'info' },
      { page_key: 'contact', page_title: 'Kontakt', page_route: '/contact', page_description: 'Kontaktní informace', is_visible: true, sort_order: 8, category: 'info' },
      { page_key: 'about', page_title: 'O oddílu', page_route: '/about', page_description: 'Informace o klubu', is_visible: true, sort_order: 9, category: 'info' },
      { page_key: 'celebration', page_title: '100 let', page_route: '/100', page_description: 'Oslava 100 let klubu', is_visible: true, sort_order: 10, category: 'info' },
      { page_key: 'login', page_title: 'Admin', page_route: '/login', page_description: 'Přihlášení do administrace', is_visible: true, sort_order: 11, category: 'admin' },
      { page_key: 'youngestKids', page_title: 'Kuřátka', page_route: '/categories/youngest-kids', page_description: 'Nejmladší se zájmem o pohyb', is_visible: true, sort_order: 12, category: 'categories' },
      { page_key: 'prepKids', page_title: 'Přípravka', page_route: '/categories/prep-kids', page_description: 'Děti 5-10 let, turnajové kategorie', is_visible: true, sort_order: 13, category: 'categories' },
      { page_key: 'youngerBoys', page_title: 'Mladší žáci', page_route: '/categories/younger-boys', page_description: 'Kluci 9-12 let, SM oblast', is_visible: true, sort_order: 14, category: 'categories' },
      { page_key: 'youngerGirls', page_title: 'Mladší žáčky', page_route: '/categories/younger-girls', page_description: 'Devčata 9-12 let, SM oblast', is_visible: true, sort_order: 15, category: 'categories' },
      { page_key: 'olderBoys', page_title: 'Starší žáci', page_route: '/categories/older-boys', page_description: 'Kluci 12-15 let, SM oblast', is_visible: true, sort_order: 16, category: 'categories' },
      { page_key: 'olderGirls', page_title: 'Starší žáčky', page_route: '/categories/older-girls', page_description: 'Devčata 12-15 let, SM oblast', is_visible: true, sort_order: 17, category: 'categories' },
      { page_key: 'juniorBoys', page_title: 'Dorostenci', page_route: '/categories/junior-boys', page_description: 'Junioři 15-18 let, SM oblast', is_visible: true, sort_order: 18, category: 'categories' },
      { page_key: 'juniorGirls', page_title: 'Dorostenky', page_route: '/categories/junior-girls', page_description: 'Juniorky 15-18 let, SM oblast', is_visible: true, sort_order: 19, category: 'categories' },
      { page_key: 'men', page_title: 'Muži', page_route: '/categories/men', page_description: '1.liga mužů, SM oblast', is_visible: true, sort_order: 20, category: 'categories' },
      { page_key: 'women', page_title: 'Ženy', page_route: '/categories/women', page_description: 'Oblastní liga žen, SM oblast', is_visible: true, sort_order: 21, category: 'categories' }
    ];

    for (const page of defaultPages) {
      const { error: insertError } = await supabase
        .from('page_visibility')
        .upsert(page, { onConflict: 'page_key' });

      if (insertError) {
        console.error(`❌ Error inserting ${page.page_key}:`, insertError.message);
      } else {
        console.log(`   ✅ ${page.page_title} (${page.page_key})`);
      }
    }

    console.log('\n🎉 Page visibility system setup complete!');
    console.log('\n📖 Next steps:');
    console.log('   1. Go to Admin → Club Config → Stránky klubu');
    console.log('   2. Configure which pages should be visible');
    console.log('   3. Adjust the order of pages in navigation');
    console.log('   4. Test the changes on the public website');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 You may need to run the SQL script manually in your Supabase dashboard');
    console.log('   File: scripts/create_page_visibility_table.sql');
    process.exit(1);
  }
}

// Run the setup
setupPageVisibility();

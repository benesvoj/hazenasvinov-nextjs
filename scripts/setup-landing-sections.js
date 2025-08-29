const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupLandingSections() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing environment variables:');
        console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
        console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log('🚀 Setting up landing page sections...');

        // Check if page_visibility table exists
        const { data: tableCheck, error: tableError } = await supabase
            .from('page_visibility')
            .select('id')
            .limit(1);

        if (tableError) {
            console.error('❌ page_visibility table does not exist. Please run setup:page-visibility first.');
            process.exit(1);
        }

        // Add landing page sections
        const { data, error } = await supabase
            .from('page_visibility')
            .upsert([
                {
                    page_key: 'club_highlight_section',
                    page_title: 'Sekce "O našem oddílu"',
                    page_route: '/',
                    page_description: 'Sekce na hlavní stránce zobrazující informace o klubu a jeho historii',
                    is_visible: true,
                    sort_order: 1,
                    category: 'landing',
                    is_active: true
                },
                {
                    page_key: 'sponsors_section',
                    page_title: 'Sekce "Naši partneři a sponzoři"',
                    page_route: '/',
                    page_description: 'Sekce na hlavní stránce zobrazující seznam partnerů a sponzorů klubu',
                    is_visible: true,
                    sort_order: 2,
                    category: 'landing',
                    is_active: true
                },
                {
                    page_key: 'call_to_action_section',
                    page_title: 'Sekce "Chcete se připojit k našemu týmu?"',
                    page_route: '/',
                    page_description: 'Sekce na hlavní stránce zobrazující výzvu k připojení se ke klubu',
                    is_visible: true,
                    sort_order: 3,
                    category: 'landing',
                    is_active: true
                }
            ], {
                onConflict: 'page_key'
            });

        if (error) {
            console.error('❌ Error adding landing page sections:', error);
            process.exit(1);
        }

        console.log('✅ Landing page sections setup completed successfully!');
        console.log('📝 Added/Updated sections:');
        console.log('   - Club Highlight Section');
        console.log('   - Sponsors Section');
        console.log('   - Call to Action Section');
        console.log('');
        console.log('🎯 You can now manage these sections in the Club Config admin panel.');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

setupLandingSections();

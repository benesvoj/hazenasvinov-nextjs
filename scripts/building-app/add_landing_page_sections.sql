-- Add landing page sections to page_visibility table
-- This script adds the three main sections that can be toggled on/off

INSERT INTO page_visibility (
    page_key,
    page_title,
    page_route,
    page_description,
    is_visible,
    sort_order,
    category,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'club_highlight_section',
    'Sekce "O našem oddílu"',
    '/',
    'Sekce na hlavní stránce zobrazující informace o klubu a jeho historii',
    true,
    1,
    'landing',
    true,
    NOW(),
    NOW()
),
(
    'sponsors_section',
    'Sekce "Naši partneři a sponzoři"',
    '/',
    'Sekce na hlavní stránce zobrazující seznam partnerů a sponzorů klubu',
    true,
    2,
    'landing',
    true,
    NOW(),
    NOW()
),
(
    'call_to_action_section',
    'Sekce "Chcete se připojit k našemu týmu?"',
    '/',
    'Sekce na hlavní stránce zobrazující výzvu k připojení se ke klubu',
    true,
    3,
    'landing',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (page_key) DO UPDATE SET
    page_title = EXCLUDED.page_title,
    page_description = EXCLUDED.page_description,
    category = EXCLUDED.category,
    updated_at = NOW();

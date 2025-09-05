-- Category Lineups System
-- This system allows coaches to manage team lineups for each category
-- Different from match lineups - these represent the actual team composition

-- 1. Create category_lineups table
CREATE TABLE IF NOT EXISTS category_lineups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(category_id, season_id, name)
);

-- 2. Create category_lineup_members table
CREATE TABLE IF NOT EXISTS category_lineup_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lineup_id UUID NOT NULL REFERENCES category_lineups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    position VARCHAR(20) NOT NULL CHECK (position IN ('goalkeeper', 'field_player')),
    jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
    is_captain BOOLEAN DEFAULT false,
    is_vice_captain BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(lineup_id, member_id),
    UNIQUE(lineup_id, jersey_number)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_lineups_category ON category_lineups(category_id);
CREATE INDEX IF NOT EXISTS idx_category_lineups_season ON category_lineups(season_id);
CREATE INDEX IF NOT EXISTS idx_category_lineups_created_by ON category_lineups(created_by);
CREATE INDEX IF NOT EXISTS idx_category_lineups_active ON category_lineups(is_active);

CREATE INDEX IF NOT EXISTS idx_category_lineup_members_lineup ON category_lineup_members(lineup_id);
CREATE INDEX IF NOT EXISTS idx_category_lineup_members_member ON category_lineup_members(member_id);
CREATE INDEX IF NOT EXISTS idx_category_lineup_members_active ON category_lineup_members(is_active);

-- 4. Enable RLS
ALTER TABLE category_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_lineup_members ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for category_lineups
-- Coaches can view lineups for their assigned categories
CREATE POLICY "Coaches can view lineups for their categories" ON category_lineups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = category_lineups.category_id
                ))
            )
        )
    );

-- Coaches can create lineups for their assigned categories
CREATE POLICY "Coaches can create lineups for their categories" ON category_lineups
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = category_lineups.category_id
                ))
            )
        )
    );

-- Coaches can update their own lineups
CREATE POLICY "Coaches can update their own lineups" ON category_lineups
    FOR UPDATE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = category_lineups.category_id
                ))
            )
        )
    ) WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = category_lineups.category_id
                ))
            )
        )
    );

-- Coaches can delete their own lineups
CREATE POLICY "Coaches can delete their own lineups" ON category_lineups
    FOR DELETE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = category_lineups.category_id
                ))
            )
        )
    );

-- 6. Create RLS policies for category_lineup_members
-- Coaches can view lineup members for their categories
CREATE POLICY "Coaches can view lineup members for their categories" ON category_lineup_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM category_lineups cl
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE cl.id = category_lineup_members.lineup_id
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = cl.category_id
                ))
            )
        )
    );

-- Coaches can add members to their lineups
CREATE POLICY "Coaches can add members to their lineups" ON category_lineup_members
    FOR INSERT WITH CHECK (
        added_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM category_lineups cl
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE cl.id = category_lineup_members.lineup_id
            AND cl.created_by = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = cl.category_id
                ))
            )
        )
    );

-- Coaches can update members in their lineups
CREATE POLICY "Coaches can update members in their lineups" ON category_lineup_members
    FOR UPDATE USING (
        added_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM category_lineups cl
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE cl.id = category_lineup_members.lineup_id
            AND cl.created_by = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = cl.category_id
                ))
            )
        )
    ) WITH CHECK (
        added_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM category_lineups cl
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE cl.id = category_lineup_members.lineup_id
            AND cl.created_by = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = cl.category_id
                ))
            )
        )
    );

-- Coaches can remove members from their lineups
CREATE POLICY "Coaches can remove members from their lineups" ON category_lineup_members
    FOR DELETE USING (
        added_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM category_lineups cl
            JOIN user_profiles up ON up.user_id = auth.uid()
            WHERE cl.id = category_lineup_members.lineup_id
            AND cl.created_by = auth.uid()
            AND (
                up.role = 'head_coach' OR
                (up.role = 'coach' AND EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.id = ANY(up.assigned_categories) 
                    AND c.id = cl.category_id
                ))
            )
        )
    );

-- 7. Add comments
COMMENT ON TABLE category_lineups IS 'Team lineups for each category and season';
COMMENT ON TABLE category_lineup_members IS 'Members in category lineups with their positions and roles';

-- 8. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_category_lineups_updated_at 
    BEFORE UPDATE ON category_lineups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_lineup_members_updated_at 
    BEFORE UPDATE ON category_lineup_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

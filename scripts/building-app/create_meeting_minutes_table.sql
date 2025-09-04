-- Create meeting_minutes table
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number INTEGER NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_place TEXT,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  wrote_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attachment_url TEXT,
  attachment_filename TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create meeting_attendees table
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_minutes_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_season_id ON meeting_minutes(season_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_date ON meeting_minutes(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_number ON meeting_minutes(meeting_number);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_wrote_by ON meeting_minutes(wrote_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_is_active ON meeting_minutes(is_active);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_minutes_id ON meeting_attendees(meeting_minutes_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_status ON meeting_attendees(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_meeting_minutes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_minutes_updated_at();

CREATE OR REPLACE FUNCTION update_meeting_attendees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meeting_attendees_updated_at
  BEFORE UPDATE ON meeting_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_attendees_updated_at();

-- Enable Row Level Security
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view meeting minutes" ON meeting_minutes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert meeting minutes" ON meeting_minutes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update meeting minutes" ON meeting_minutes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete meeting minutes" ON meeting_minutes
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view meeting attendees" ON meeting_attendees
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert meeting attendees" ON meeting_attendees
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update meeting attendees" ON meeting_attendees
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete meeting attendees" ON meeting_attendees
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE meeting_minutes IS 'Meeting minutes from board meetings';
COMMENT ON COLUMN meeting_minutes.meeting_number IS 'Sequential meeting number within the year';
COMMENT ON COLUMN meeting_minutes.meeting_date IS 'Date when the meeting took place';
COMMENT ON COLUMN meeting_minutes.meeting_place IS 'Location where the meeting was held';
COMMENT ON COLUMN meeting_minutes.season_id IS 'Related season (optional)';
COMMENT ON COLUMN meeting_minutes.wrote_by IS 'User who wrote the meeting minutes';
COMMENT ON COLUMN meeting_minutes.attachment_url IS 'URL to attached file (Word/PDF)';
COMMENT ON COLUMN meeting_minutes.attachment_filename IS 'Original filename of the attachment';

COMMENT ON TABLE meeting_attendees IS 'List of attendees for each meeting';
COMMENT ON COLUMN meeting_attendees.meeting_minutes_id IS 'Reference to meeting minutes';
COMMENT ON COLUMN meeting_attendees.user_id IS 'Reference to user who attended';
COMMENT ON COLUMN meeting_attendees.status IS 'Attendance status: present or excused';
COMMENT ON COLUMN meeting_attendees.notes IS 'Additional notes about attendance';


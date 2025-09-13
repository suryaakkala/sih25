-- Add table for tracking recommendation interactions
CREATE TABLE IF NOT EXISTS recommendation_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'dismissed', 'acted_upon')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recommendation_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recommendation interactions" ON recommendation_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation interactions" ON recommendation_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_recommendation_interactions_user_id ON recommendation_interactions(user_id);
CREATE INDEX idx_recommendation_interactions_timestamp ON recommendation_interactions(timestamp);

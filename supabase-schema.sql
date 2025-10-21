-- Supabase Database Schema for Melorhy Music App

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('artist', 'listener')) NOT NULL DEFAULT 'listener',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255) NOT NULL,
  artwork_url TEXT,
  preview_url TEXT,
  genres TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_uploaded_by ON tracks(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
CREATE INDEX IF NOT EXISTS idx_tracks_genres ON tracks USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_playlists_created_by ON playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for tracks table
CREATE POLICY "Anyone can view tracks" ON tracks FOR SELECT USING (true);
CREATE POLICY "Artists can insert tracks" ON tracks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = uploaded_by 
    AND role = 'artist'
  )
);
CREATE POLICY "Artists can update their own tracks" ON tracks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = uploaded_by 
    AND role = 'artist'
  )
);
CREATE POLICY "Artists can delete their own tracks" ON tracks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = uploaded_by 
    AND role = 'artist'
  )
);

-- RLS Policies for playlists table
CREATE POLICY "Users can view all playlists" ON playlists FOR SELECT USING (true);
CREATE POLICY "Users can create playlists" ON playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own playlists" ON playlists FOR UPDATE USING (
  created_by = auth.uid()::uuid
);
CREATE POLICY "Users can delete their own playlists" ON playlists FOR DELETE USING (
  created_by = auth.uid()::uuid
);

-- RLS Policies for playlist_tracks table
CREATE POLICY "Users can view playlist tracks" ON playlist_tracks FOR SELECT USING (true);
CREATE POLICY "Users can add tracks to playlists" ON playlist_tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove tracks from playlists" ON playlist_tracks FOR DELETE USING (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (username, email, role) VALUES 
  ('demo_artist', 'artist@melorhy.com', 'artist'),
  ('demo_listener', 'listener@melorhy.com', 'listener')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tracks
INSERT INTO tracks (title, artist, album, artwork_url, preview_url, genres, uploaded_by) VALUES 
  (
    'Sample Track 1', 
    'Demo Artist', 
    'Demo Album', 
    'https://picsum.photos/300/300?random=1',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    ARRAY['Electronic', 'Ambient'],
    (SELECT id FROM users WHERE username = 'demo_artist' LIMIT 1)
  ),
  (
    'Sample Track 2', 
    'Demo Artist', 
    'Demo Album', 
    'https://picsum.photos/300/300?random=2',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    ARRAY['Rock', 'Alternative'],
    (SELECT id FROM users WHERE username = 'demo_artist' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

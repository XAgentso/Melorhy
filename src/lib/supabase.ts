// Supabase configuration
import { createClient } from '@supabase/supabase-js'

// Your Supabase project credentials
const supabaseUrl = 'https://iervljvsadoposytuxsu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcnZsanZzYWRvcG9zeXR1eHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzAxNzEsImV4cCI6MjA3NjUwNjE3MX0.UsJqESngc03WS6NfKp1qS7oiv5Q0lc-r-BmAfC3Z6IA'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names
export const TABLES = {
  TRACKS: 'tracks',
  USERS: 'users',
  PLAYLISTS: 'playlists',
  PLAYLIST_TRACKS: 'playlist_tracks'
} as const

// Track interface for Supabase
export interface SupabaseTrack {
  id: string
  title: string
  artist: string
  album: string
  artwork_url: string
  preview_url: string
  genres: string[]
  uploaded_by: string
  created_at: string
  updated_at: string
}

// User interface for Supabase
export interface SupabaseUser {
  id: string
  username: string
  email: string
  role: 'artist' | 'listener'
  created_at: string
}

// Playlist interface for Supabase
export interface SupabasePlaylist {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

// Playlist track junction table
export interface SupabasePlaylistTrack {
  playlist_id: string
  track_id: string
  position: number
  added_at: string
}

// Supabase service functions for Melorhy
import { supabase, TABLES, type SupabaseTrack, type SupabaseUser, type SupabasePlaylist } from './supabase'

// Convert Supabase track to app track format
export function convertSupabaseTrack(supabaseTrack: SupabaseTrack) {
  return {
    id: supabaseTrack.id,
    title: supabaseTrack.title,
    artist: supabaseTrack.artist,
    album: supabaseTrack.album,
    artworkUrl: supabaseTrack.artwork_url,
    previewUrl: supabaseTrack.preview_url,
    genres: supabaseTrack.genres
  }
}

// Convert app track to Supabase track format
export function convertToSupabaseTrack(track: any, uploadedBy: string): Partial<SupabaseTrack> {
  return {
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork_url: track.artworkUrl,
    preview_url: track.previewUrl,
    genres: track.genres,
    uploaded_by: uploadedBy
  }
}

// Track operations
export async function fetchTracks(): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLES.TRACKS)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tracks:', error)
    return []
  }

  return data?.map(convertSupabaseTrack) || []
}

export async function addTrack(track: any, uploadedBy: string): Promise<string | null> {
  const supabaseTrack = convertToSupabaseTrack(track, uploadedBy)
  
  const { data, error } = await supabase
    .from(TABLES.TRACKS)
    .insert(supabaseTrack)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding track:', error)
    return null
  }

  return data.id
}

export async function updateTrack(trackId: string, updates: Partial<any>): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.TRACKS)
    .update({
      title: updates.title,
      artist: updates.artist,
      album: updates.album,
      artwork_url: updates.artworkUrl,
      preview_url: updates.previewUrl,
      genres: updates.genres
    })
    .eq('id', trackId)

  if (error) {
    console.error('Error updating track:', error)
    return false
  }

  return true
}

export async function deleteTrack(trackId: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.TRACKS)
    .delete()
    .eq('id', trackId)

  if (error) {
    console.error('Error deleting track:', error)
    return false
  }

  return true
}

// User operations
export async function createUser(userData: {
  username: string
  email: string
  role: 'artist' | 'listener'
}): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .insert(userData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data.id
}

export async function getUserByEmail(email: string): Promise<SupabaseUser | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

// Playlist operations
export async function fetchPlaylists(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLES.PLAYLISTS)
    .select(`
      *,
      playlist_tracks (
        track_id,
        position,
        tracks (*)
      )
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching playlists:', error)
    return []
  }

  return data || []
}

export async function createPlaylist(name: string, createdBy: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLES.PLAYLISTS)
    .insert({ name, created_by: createdBy })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating playlist:', error)
    return null
  }

  return data.id
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  // Get the next position
  const { data: maxPos } = await supabase
    .from(TABLES.PLAYLIST_TRACKS)
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (maxPos?.position || 0) + 1

  const { error } = await supabase
    .from(TABLES.PLAYLIST_TRACKS)
    .insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition
    })

  if (error) {
    console.error('Error adding track to playlist:', error)
    return false
  }

  return true
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.PLAYLIST_TRACKS)
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)

  if (error) {
    console.error('Error removing track from playlist:', error)
    return false
  }

  return true
}

// Real-time subscriptions
export function subscribeToTracks(
  onInsert: (track: any) => void,
  onUpdate: (track: any) => void,
  onDelete: (trackId: string) => void
) {
  return supabase
    .channel('tracks')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: TABLES.TRACKS },
      (payload) => onInsert(convertSupabaseTrack(payload.new as SupabaseTrack))
    )
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: TABLES.TRACKS },
      (payload) => onUpdate(convertSupabaseTrack(payload.new as SupabaseTrack))
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: TABLES.TRACKS },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe()
}

export function subscribeToPlaylists(
  userId: string,
  onInsert: (playlist: any) => void,
  onUpdate: (playlist: any) => void,
  onDelete: (playlistId: string) => void
) {
  return supabase
    .channel('playlists')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: TABLES.PLAYLISTS },
      (payload) => {
        if (payload.new.created_by === userId) {
          onInsert(payload.new)
        }
      }
    )
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: TABLES.PLAYLISTS },
      (payload) => {
        if (payload.new.created_by === userId) {
          onUpdate(payload.new)
        }
      }
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: TABLES.PLAYLISTS },
      (payload) => {
        if (payload.old.created_by === userId) {
          onDelete(payload.old.id)
        }
      }
    )
    .subscribe()
}

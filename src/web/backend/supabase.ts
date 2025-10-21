import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Track } from '../state/types'

export function getSupabaseClient(): SupabaseClient | null {
	const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
	const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
	if (!url || !anon) return null
	return createClient(url, anon)
}

export async function fetchRemoteTracks(client: SupabaseClient): Promise<Track[]> {
	// Expect table: tracks (id text PK, title text, artist text, album text, artwork_url text, audio_url text, duration_sec int4, genres text)
	const { data, error } = await client
		.from('tracks')
		.select('id,title,artist,album,artwork_url,audio_url,duration_sec,genres')
		.order('title', { ascending: true })
	if (error) throw error
	return (data ?? []).map(mapRowToTrack)
}

export function subscribeTracks(
	client: SupabaseClient,
	onUpsert: (t: Track) => void,
	onDelete: (id: string) => void
) {
	return client
		.channel('public:tracks')
		.on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, (payload) => {
			if (payload.eventType === 'DELETE') {
				onDelete((payload.old as any).id as string)
			} else {
				onUpsert(mapRowToTrack((payload.new as any)))
			}
		})
		.subscribe()
}

function mapRowToTrack(row: any): Track {
	return {
		id: String(row.id),
		title: row.title ?? 'Untitled',
		artist: row.artist ?? 'Unknown Artist',
		album: row.album ?? 'Single',
		artworkUrl: row.artwork_url ?? 'https://picsum.photos/seed/remote/300/300',
		previewUrl: row.audio_url ?? '',
		durationSec: Number(row.duration_sec ?? 0),
		genres: typeof row.genres === 'string' ? String(row.genres).split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(row.genres) ? row.genres : []
	}
}

export async function uploadAudioAndCreateTrack(
	client: SupabaseClient,
	file: File,
	metadata: Omit<Track, 'id' | 'previewUrl' | 'durationSec'> & { previewUrl?: string; durationSec?: number }
): Promise<Track> {
	const path = `uploads/${crypto.randomUUID()}-${file.name}`
	const { error: upErr } = await client.storage.from('audio').upload(path, file, { cacheControl: '3600', upsert: false })
	if (upErr) throw upErr
	const { data: publicUrl } = client.storage.from('audio').getPublicUrl(path)
	const record = {
		id: crypto.randomUUID(),
		title: metadata.title,
		artist: metadata.artist,
		album: metadata.album,
		artwork_url: metadata.artworkUrl,
		audio_url: metadata.previewUrl ?? publicUrl.publicUrl,
		duration_sec: metadata.durationSec ?? null,
		genres: (metadata.genres ?? []).join(',')
	}
	const { data, error } = await client.from('tracks').insert(record).select().single()
	if (error) throw error
	return mapRowToTrack(data)
}




export type TrackId = string
export type PlaylistId = string

export interface Track {
	id: TrackId
	title: string
	artist: string
	album: string
	artworkUrl: string
	previewUrl: string
	durationSec: number
	genres: string[]
}

export interface Playlist {
	id: PlaylistId
	name: string
	trackIds: TrackId[]
}

export interface LibraryState {
	tracks: Record<TrackId, Track>
	trackOrder: TrackId[]
	favorites: Set<TrackId>
	userTrackIds: Set<TrackId>
}

export interface PlayerState {
	queue: TrackId[]
	queueIndex: number
	isPlaying: boolean
	volume: number // 0..1
	loop: 'off' | 'one' | 'all'
	shuffle: boolean
}

export interface PlaylistsState {
	playlists: Record<PlaylistId, Playlist>
	playlistOrder: PlaylistId[]
}

export type UserRole = 'artist' | 'listener' | null

export interface AuthState {
	user: string | null
	role: UserRole
	isAuthenticated: boolean
}



import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { LibraryState, Track, TrackId } from './types'
import { sampleTracks } from '../data/catalog'

type LibraryAction =
	| { type: 'initialize'; tracks: Track[] }
	| { type: 'toggle_favorite'; trackId: TrackId }
	| { type: 'add_track'; track: Track; userAdded?: boolean }
	| { type: 'remove_track'; trackId: TrackId }

const favoritesKey = 'ml_favorites_v1'
const userTracksKey = 'ml_user_tracks_v1'

function loadUserTracks(): Track[] {
	try {
		const raw = localStorage.getItem(userTracksKey)
		if (!raw) return []
		return JSON.parse(raw) as Track[]
	} catch {
		return []
	}
}

function persistUserTracks(state: LibraryState): void {
	try {
		const tracks: Track[] = Array.from(state.userTrackIds).map((id) => state.tracks[id])
		localStorage.setItem(userTracksKey, JSON.stringify(tracks))
	} catch {
		// ignore
	}
}

function loadFavorites(): Set<TrackId> {
	try {
		const raw = localStorage.getItem(favoritesKey)
		if (!raw) return new Set()
		const arr = JSON.parse(raw) as TrackId[]
		return new Set(arr)
	} catch {
		return new Set()
	}
}

function persistFavorites(set: Set<TrackId>): void {
	try {
		localStorage.setItem(favoritesKey, JSON.stringify(Array.from(set)))
	} catch {
		// ignore
	}
}

function reducer(state: LibraryState, action: LibraryAction): LibraryState {
	switch (action.type) {
		case 'initialize': {
			const tracks: Record<TrackId, Track> = {}
			const order: TrackId[] = []
			for (const t of action.tracks) {
				tracks[t.id] = t
				order.push(t.id)
			}
			const saved = loadUserTracks()
			const mergedTracks = { ...tracks }
			const mergedOrder = [...order]
			for (const t of saved) {
				mergedTracks[t.id] = t
				mergedOrder.push(t.id)
			}
			return {
				tracks: mergedTracks,
				trackOrder: mergedOrder,
				favorites: loadFavorites(),
				userTrackIds: new Set(saved.map((t) => t.id))
			}
		}
		case 'toggle_favorite': {
			const next = new Set(state.favorites)
			if (next.has(action.trackId)) next.delete(action.trackId)
			else next.add(action.trackId)
			persistFavorites(next)
			return { ...state, favorites: next }
		}
		case 'add_track': {
			const t = action.track
			if (state.tracks[t.id]) return state
			const next = {
				...state,
				tracks: { ...state.tracks, [t.id]: t },
				trackOrder: [...state.trackOrder, t.id],
				userTrackIds: new Set([...state.userTrackIds, t.id])
			}
			persistUserTracks(next)
			return next
		}
		case 'remove_track': {
			if (!state.userTrackIds.has(action.trackId)) return state
			const { [action.trackId]: _, ...rest } = state.tracks
			const next = {
				...state,
				tracks: rest,
				trackOrder: state.trackOrder.filter((id) => id !== action.trackId),
				favorites: new Set(Array.from(state.favorites).filter((id) => id !== action.trackId)),
				userTrackIds: new Set(Array.from(state.userTrackIds).filter((id) => id !== action.trackId))
			}
			persistFavorites(next.favorites)
			persistUserTracks(next)
			return next
		}
		default:
			return state
	}
}

interface LibraryContextValue extends LibraryState {
	initialize: (tracks?: Track[]) => void
	toggleFavorite: (trackId: TrackId) => void
	addTrack: (track: Track) => void
	removeTrack: (trackId: TrackId) => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
		tracks: {},
		trackOrder: [],
		favorites: new Set<TrackId>(),
		userTrackIds: new Set<TrackId>()
	})

	const value = useMemo<LibraryContextValue>(() => ({
		...state,
		initialize: (tracks = sampleTracks) => dispatch({ type: 'initialize', tracks }),
		toggleFavorite: (trackId) => dispatch({ type: 'toggle_favorite', trackId }),
		addTrack: (track) => dispatch({ type: 'add_track', track, userAdded: true }),
		removeTrack: (trackId) => dispatch({ type: 'remove_track', trackId })
	}), [state])

	return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
	const ctx = useContext(LibraryContext)
	if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
	return ctx
}



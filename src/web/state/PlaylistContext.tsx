import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { PlaylistsState, PlaylistId, TrackId } from './types'

type Action =
	| { type: 'create'; name: string }
	| { type: 'rename'; id: PlaylistId; name: string }
	| { type: 'remove'; id: PlaylistId }
	| { type: 'add_track'; id: PlaylistId; trackId: TrackId }
	| { type: 'remove_track'; id: PlaylistId; trackId: TrackId }

const playlistsKey = 'ml_playlists_v1'

function loadPlaylists(): PlaylistsState | null {
	try {
		const raw = localStorage.getItem(playlistsKey)
		if (!raw) return null
		return JSON.parse(raw) as PlaylistsState
	} catch {
		return null
	}
}

function persist(state: PlaylistsState): void {
	try {
		localStorage.setItem(playlistsKey, JSON.stringify(state))
	} catch {
		// ignore
	}
}

function reducer(state: PlaylistsState, action: Action): PlaylistsState {
	let next: PlaylistsState = state
	switch (action.type) {
		case 'create': {
			const id = `pl-${crypto.randomUUID()}`
			next = {
				...state,
				playlists: {
					...state.playlists,
					[id]: { id, name: action.name, trackIds: [] }
				},
				playlistOrder: [...state.playlistOrder, id]
			}
			break
		}
		case 'rename': {
			const pl = state.playlists[action.id]
			if (!pl) return state
			next = {
				...state,
				playlists: { ...state.playlists, [action.id]: { ...pl, name: action.name } }
			}
			break
		}
		case 'remove': {
			const { [action.id]: _, ...rest } = state.playlists
			next = {
				...state,
				playlists: rest,
				playlistOrder: state.playlistOrder.filter((id) => id !== action.id)
			}
			break
		}
		case 'add_track': {
			const pl = state.playlists[action.id]
			if (!pl) return state
			if (pl.trackIds.includes(action.trackId)) return state
			next = {
				...state,
				playlists: {
					...state.playlists,
					[action.id]: { ...pl, trackIds: [...pl.trackIds, action.trackId] }
				}
			}
			break
		}
		case 'remove_track': {
			const pl = state.playlists[action.id]
			if (!pl) return state
			next = {
				...state,
				playlists: {
					...state.playlists,
					[action.id]: { ...pl, trackIds: pl.trackIds.filter((t) => t !== action.trackId) }
				}
			}
			break
		}
	}

	persist(next)
	return next
}

interface PlaylistsContextValue extends PlaylistsState {
	createPlaylist: (name: string) => void
	renamePlaylist: (id: PlaylistId, name: string) => void
	removePlaylist: (id: PlaylistId) => void
	addTrackTo: (id: PlaylistId, trackId: TrackId) => void
	removeTrackFrom: (id: PlaylistId, trackId: TrackId) => void
}

const PlaylistsContext = createContext<PlaylistsContextValue | null>(null)

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const saved = loadPlaylists()
	const [state, dispatch] = useReducer(reducer, saved ?? { playlists: {}, playlistOrder: [] })

	const value = useMemo<PlaylistsContextValue>(() => ({
		...state,
		createPlaylist: (name) => dispatch({ type: 'create', name }),
		renamePlaylist: (id, name) => dispatch({ type: 'rename', id, name }),
		removePlaylist: (id) => dispatch({ type: 'remove', id }),
		addTrackTo: (id, trackId) => dispatch({ type: 'add_track', id, trackId }),
		removeTrackFrom: (id, trackId) => dispatch({ type: 'remove_track', id, trackId })
	}), [state])

	return <PlaylistsContext.Provider value={value}>{children}</PlaylistsContext.Provider>
}

export function usePlaylists(): PlaylistsContextValue {
	const ctx = useContext(PlaylistsContext)
	if (!ctx) throw new Error('usePlaylists must be used within PlaylistProvider')
	return ctx
}



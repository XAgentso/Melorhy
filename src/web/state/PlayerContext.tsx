import React, { createContext, useContext, useMemo, useReducer, useRef, useEffect } from 'react'
import type { PlayerState, TrackId } from './types'

type PlayerAction =
	| { type: 'set_queue'; queue: TrackId[]; startIndex?: number }
	| { type: 'play' }
	| { type: 'pause' }
	| { type: 'next' }
	| { type: 'prev' }
	| { type: 'set_index'; index: number }
	| { type: 'set_volume'; volume: number }
	| { type: 'toggle_shuffle' }
	| { type: 'cycle_loop' }

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
	switch (action.type) {
		case 'set_queue':
			return { ...state, queue: action.queue, queueIndex: action.startIndex ?? 0 }
		case 'play':
			return { ...state, isPlaying: true }
		case 'pause':
			return { ...state, isPlaying: false }
		case 'next': {
			if (state.queue.length === 0) return state
			const isLast = state.queueIndex >= state.queue.length - 1
			if (isLast) {
				if (state.loop === 'all') return { ...state, queueIndex: 0 }
				return { ...state, isPlaying: false }
			}
			return { ...state, queueIndex: state.queueIndex + 1 }
		}
		case 'prev': {
			if (state.queue.length === 0) return state
			const isFirst = state.queueIndex <= 0
			if (isFirst) return state
			return { ...state, queueIndex: state.queueIndex - 1 }
		}
		case 'set_index':
			return { ...state, queueIndex: Math.max(0, Math.min(action.index, state.queue.length - 1)) }
		case 'set_volume':
			return { ...state, volume: Math.max(0, Math.min(action.volume, 1)) }
		case 'toggle_shuffle':
			return { ...state, shuffle: !state.shuffle }
		case 'cycle_loop': {
			const next: PlayerState['loop'] = state.loop === 'off' ? 'all' : state.loop === 'all' ? 'one' : 'off'
			return { ...state, loop: next }
		}
		default:
			return state
	}
}

interface PlayerContextValue extends PlayerState {
	setQueue: (queue: TrackId[], startIndex?: number) => void
	play: () => void
	pause: () => void
	next: () => void
	prev: () => void
	setIndex: (index: number) => void
	setVolume: (volume: number) => void
	toggleShuffle: () => void
	cycleLoop: () => void
	audioRef: React.RefObject<HTMLAudioElement | null>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, {
		queue: [],
		queueIndex: 0,
		isPlaying: false,
		volume: 0.9,
		loop: 'off',
		shuffle: false
	})

	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		if (!audioRef.current) return
		audioRef.current.volume = state.volume
	}, [state.volume])

	// Keep the <audio> element in sync with player state
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		// Reset position when track changes
		audio.currentTime = 0

		if (state.isPlaying) {
			// Attempt to play; if blocked by the browser, revert to paused state
			audio.play().catch(() => {
				dispatch({ type: 'pause' })
			})
		} else {
			audio.pause()
		}
	// Re-run when play/pause toggles or current track changes
	}, [state.isPlaying, state.queueIndex, state.queue])

	const value = useMemo<PlayerContextValue>(() => ({
		...state,
		setQueue: (q, startIndex) => dispatch({ type: 'set_queue', queue: q, startIndex }),
		play: () => dispatch({ type: 'play' }),
		pause: () => dispatch({ type: 'pause' }),
		next: () => dispatch({ type: 'next' }),
		prev: () => dispatch({ type: 'prev' }),
		setIndex: (i) => dispatch({ type: 'set_index', index: i }),
		setVolume: (v) => dispatch({ type: 'set_volume', volume: v }),
		toggleShuffle: () => dispatch({ type: 'toggle_shuffle' }),
		cycleLoop: () => dispatch({ type: 'cycle_loop' }),
		audioRef
	}), [state])

	return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextValue {
	const ctx = useContext(PlayerContext)
	if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
	return ctx
}



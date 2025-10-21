import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../../web/state/LibraryContext'
import { usePlayer } from '../../web/state/PlayerContext'
import { usePlaylists } from '../../web/state/PlaylistContext'
import { useAuth } from '../../web/state/AuthContext'
import type { TrackId } from '../../web/state/types'
import { fetchTracks, subscribeToTracks } from '../../lib/supabaseService'

export const MusicPage: React.FC = () => {
	const navigate = useNavigate()
	const library = useLibrary()
	const player = usePlayer()
	const playlists = usePlaylists()
	const { user, role } = useAuth()
	const [query, setQuery] = useState('')

	useEffect(() => {
		library.initialize()
		
		// Fetch tracks from Supabase
		fetchTracks().then((tracks) => {
			tracks.forEach(track => library.addTrack(track))
		}).catch((error) => {
			console.log('Failed to fetch tracks from Supabase:', error)
		})

		// Subscribe to real-time updates
		const subscription = subscribeToTracks(
			(track) => {
				console.log('New track added:', track)
				library.addTrack(track)
			},
			(track) => {
				console.log('Track updated:', track)
				library.addTrack(track) // This will update the existing track
			},
			(trackId) => {
				console.log('Track deleted:', trackId)
				library.removeTrack(trackId)
			}
		)

		return () => {
			subscription.unsubscribe()
		}
	}, [])

	const tracks = useMemo(() => {
		const all = library.trackOrder.map((id) => library.tracks[id])
		const q = query.trim().toLowerCase()
		if (!q) return all
		return all.filter((t) =>
			[t.title, t.artist, t.album, ...t.genres].some((s) => s.toLowerCase().includes(q))
		)
	}, [library.tracks, library.trackOrder, query])

	function playTrackList(ids: TrackId[], index: number): void {
		player.setQueue(ids, index)
		player.play()
	}

	return (
		<div className="music-page">
			<header className="topbar">
				<img src="/logo.jpg" alt="Melorhy" className="logo" />
				<h1 className="brand">Melorhy</h1>
				<div className="user-info">
					<span>Welcome, {user}</span>
					<span className="role-badge">{role}</span>
					{role === 'artist' && (
						<button 
							className="upload-nav-btn"
							onClick={() => navigate('/upload')}
						>
							Upload Music
						</button>
					)}
				</div>
				<input
					className="search"
					placeholder="Search songs, artists, albums, genres"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</header>

			<main className="content">
				<section className="tracks">
					<h2>All Tracks</h2>
					<ul className="track-list">
						{tracks.map((t, idx) => (
							<li key={t.id} className="track-item">
								<img src={t.artworkUrl} className="art" alt="" />
								<div className="meta">
									<div className="title">{t.title}</div>
									<div className="sub">{t.artist} • {t.album}</div>
								</div>
								<div className="actions">
									<button onClick={() => playTrackList(tracks.map((x) => x.id), idx)}>Play</button>
									<button onClick={() => library.toggleFavorite(t.id)} title="Toggle Favorite">
										{library.favorites.has(t.id) ? '♥' : '♡'}
									</button>
									<select onChange={(e) => e.target.value && playlists.addTrackTo(e.target.value, t.id)} defaultValue="">
										<option value="" disabled>Add to playlist…</option>
										{playlists.playlistOrder.map((pid) => (
											<option key={pid} value={pid}>{playlists.playlists[pid].name}</option>
										))}
									</select>
								</div>
							</li>
						))}
					</ul>
				</section>

				<aside className="sidebar">
					<h2>Playlists</h2>
					<PlaylistList />
					<h2>Favorites</h2>
					<ul className="track-list small">
						{Array.from(library.favorites).map((id) => {
							const t = library.tracks[id]
							if (!t) return null
							return (
								<li key={id} className="track-item">
									<img src={t.artworkUrl} className="art" alt="" />
									<div className="meta">
										<div className="title">{t.title}</div>
										<div className="sub">{t.artist}</div>
									</div>
								</li>
							)
						})}
					</ul>
				</aside>
			</main>

			<PlayerBar />
		</div>
	)
}

const PlaylistList: React.FC = () => {
	const playlists = usePlaylists()
	const library = useLibrary()
	const player = usePlayer()
	const [newName, setNewName] = useState('')

	return (
		<div className="playlist-list">
			<div className="create">
				<input placeholder="New playlist name" value={newName} onChange={(e) => setNewName(e.target.value)} />
				<button onClick={() => { if (newName.trim()) { playlists.createPlaylist(newName.trim()); setNewName('') } }}>Create</button>
			</div>
			<ul>
				{playlists.playlistOrder.map((id) => {
					const pl = playlists.playlists[id]
					return (
						<li key={id} className="playlist">
							<div className="row">
								<strong>{pl.name}</strong>
								<span className="muted">{pl.trackIds.length} tracks</span>
							</div>
							<div className="row actions">
								<button onClick={() => player.setQueue(pl.trackIds, 0)}>Queue</button>
								<button onClick={() => playlists.removePlaylist(id)}>Delete</button>
							</div>
							<ul className="track-list small">
								{pl.trackIds.map((tid, idx) => {
									const t = library.tracks[tid]
									if (!t) return null
									return (
										<li key={tid} className="track-item">
											<img src={t.artworkUrl} className="art" alt="" />
											<div className="meta">
												<div className="title">{t.title}</div>
												<div className="sub">{t.artist}</div>
											</div>
											<div className="actions">
												<button onClick={() => player.setQueue(pl.trackIds, idx)}>Play</button>
												<button onClick={() => playlists.removeTrackFrom(id, tid)}>Remove</button>
											</div>
										</li>
									)
								})}
							</ul>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

const PlayerBar: React.FC = () => {
	const library = useLibrary()
	const player = usePlayer()
	const currentId = player.queue[player.queueIndex]
	const current = currentId ? library.tracks[currentId] : null

	return (
		<footer className="player-bar">
			{current ? (
				<>
					<img src={current.artworkUrl} className="art" alt="" />
					<div className="meta">
						<div className="title">{current.title}</div>
						<div className="sub">{current.artist}</div>
					</div>
				</>
			) : (
				<div className="meta">
					<div className="title">Nothing playing</div>
				</div>
			)}
			<div className="controls">
				<button onClick={player.prev}>⏮</button>
				{player.isPlaying ? (
					<button onClick={player.pause}>⏸</button>
				) : (
					<button onClick={player.play}>▶️</button>
				)}
				<button onClick={player.next}>⏭</button>
				<button onClick={player.toggleShuffle} className={player.shuffle ? 'active' : ''}>🔀</button>
				<button onClick={player.cycleLoop}>🔁 {player.loop}</button>
				<input type="range" min={0} max={1} step={0.01} value={player.volume} onChange={(e) => player.setVolume(Number(e.target.value))} />
			</div>
			<audio ref={player.audioRef} src={current?.previewUrl} autoPlay={player.isPlaying} onEnded={player.next} />
		</footer>
	)
}


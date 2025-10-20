import React, { useEffect, useMemo, useState } from 'react'
import { useLibrary } from '../../web/state/LibraryContext'
import { usePlayer } from '../../web/state/PlayerContext'
import { usePlaylists } from '../../web/state/PlaylistContext'
import type { TrackId } from '../../web/state/types'
import { getSupabaseClient, fetchRemoteTracks, subscribeTracks, uploadAudioAndCreateTrack } from '../../web/backend/supabase'

export const AppShell: React.FC = () => {
	const library = useLibrary()
	const player = usePlayer()
	const playlists = usePlaylists()
	const [query, setQuery] = useState('')

	useEffect(() => {
		library.initialize()
		const client = getSupabaseClient()
		if (!client) return
		let subscription: ReturnType<typeof subscribeTracks> | null = null
		fetchRemoteTracks(client)
			.then((remote) => {
				for (const t of remote) library.addTrack(t)
			})
			.catch(() => {})
		subscription = subscribeTracks(
			client,
			(t) => library.addTrack(t),
			(id) => library.removeTrack(id)
		)
		return () => {
			if (subscription) client.removeChannel(subscription)
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
		<div className="app-shell">
			<header className="topbar">
				<img src="/logo.jpg" alt="Melorhy" className="logo" />
				<h1 className="brand">Melorhy</h1>
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
					<h2>Add Music</h2>
					<AddMusicForm />
					<h2>Upload to Cloud</h2>
					<CloudUploadForm />
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

const AddMusicForm: React.FC = () => {
	const library = useLibrary()
	const [title, setTitle] = useState('')
	const [artist, setArtist] = useState('')
	const [album, setAlbum] = useState('')
	const [artworkUrl, setArtworkUrl] = useState('')
	const [previewUrl, setPreviewUrl] = useState('')
	const [durationSec, setDurationSec] = useState<number>(0)
	const [genres, setGenres] = useState('')

	function submit(): void {
		const id = `user-${crypto.randomUUID()}`
		library.addTrack({
			id,
			title: title || 'Untitled',
			artist: artist || 'Unknown Artist',
			album: album || 'Single',
			artworkUrl: artworkUrl || 'https://picsum.photos/seed/usertrack/300/300',
			previewUrl,
			durationSec: Number(durationSec) || 0,
			genres: genres.split(',').map((s) => s.trim()).filter(Boolean)
		})
		setTitle(''); setArtist(''); setAlbum(''); setArtworkUrl(''); setPreviewUrl(''); setDurationSec(0); setGenres('')
	}

	return (
		<div className="add-music">
			<input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
			<input placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
			<input placeholder="Album" value={album} onChange={(e) => setAlbum(e.target.value)} />
			<input placeholder="Artwork URL (optional)" value={artworkUrl} onChange={(e) => setArtworkUrl(e.target.value)} />
			<input placeholder="Preview URL (MP3/WAV)" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} />
			<input type="number" placeholder="Duration (sec)" value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} />
			<input placeholder="Genres (comma-separated)" value={genres} onChange={(e) => setGenres(e.target.value)} />
			<button onClick={submit} disabled={!previewUrl}>Add Track</button>
			{Array.from(library.userTrackIds).length > 0 && (
				<ul className="track-list small" style={{ marginTop: 8 }}>
					{Array.from(library.userTrackIds).map((id) => {
						const t = library.tracks[id]
						return (
							<li key={id} className="track-item">
								<img src={t.artworkUrl} className="art" alt="" />
								<div className="meta">
									<div className="title">{t.title}</div>
									<div className="sub">{t.artist}</div>
								</div>
								<div className="actions">
									<button onClick={() => library.removeTrack(id)}>Delete</button>
								</div>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}

const CloudUploadForm: React.FC = () => {
	const client = getSupabaseClient()
	const [file, setFile] = useState<File | null>(null)
	const [title, setTitle] = useState('')
	const [artist, setArtist] = useState('')
	const [album, setAlbum] = useState('')
	const [artworkUrl, setArtworkUrl] = useState('')
	const [genres, setGenres] = useState('')
	const [isBusy, setIsBusy] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	if (!client) {
		return <div className="muted">Configure Supabase env to enable cloud uploads.</div>
	}

	async function submit(): Promise<void> {
		if (!file) return
		setIsBusy(true)
		setMsg(null)
		try {
			await uploadAudioAndCreateTrack(client, file, {
				title: title || 'Untitled',
				artist: artist || 'Unknown Artist',
				album: album || 'Single',
				artworkUrl: artworkUrl || 'https://picsum.photos/seed/cloud/300/300',
				genres: genres.split(',').map((s) => s.trim()).filter(Boolean)
			})
			setFile(null); setTitle(''); setArtist(''); setAlbum(''); setArtworkUrl(''); setGenres('')
			setMsg('Uploaded')
		} catch (e) {
			setMsg('Upload failed')
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<div className="add-music">
			<input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
			<input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
			<input placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
			<input placeholder="Album" value={album} onChange={(e) => setAlbum(e.target.value)} />
			<input placeholder="Artwork URL (optional)" value={artworkUrl} onChange={(e) => setArtworkUrl(e.target.value)} />
			<input placeholder="Genres (comma-separated)" value={genres} onChange={(e) => setGenres(e.target.value)} />
			<button onClick={submit} disabled={!file || isBusy}>{isBusy ? 'Uploading…' : 'Upload & Publish'}</button>
			{msg && <div className="muted">{msg}</div>}
		</div>
	)
}



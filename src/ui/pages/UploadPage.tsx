import React, { useState } from 'react'
import { useAuth } from '../../web/state/AuthContext'
import { getSupabaseClient, uploadAudioAndCreateTrack } from '../../web/backend/supabase'

export const UploadPage: React.FC = () => {
	const { user, role } = useAuth()
	const client = getSupabaseClient()
	const [file, setFile] = useState<File | null>(null)
	const [title, setTitle] = useState('')
	const [artist, setArtist] = useState('')
	const [album, setAlbum] = useState('')
	const [artworkUrl, setArtworkUrl] = useState('')
	const [genres, setGenres] = useState('')
	const [isBusy, setIsBusy] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	if (role !== 'artist') {
		return (
			<div className="upload-page">
				<div className="access-denied">
					<h1>Access Denied</h1>
					<p>Only artists can upload music.</p>
				</div>
			</div>
		)
	}

	if (!client) {
		return (
			<div className="upload-page">
				<div className="config-error">
					<h1>Configuration Required</h1>
					<p>Supabase environment variables not configured.</p>
				</div>
			</div>
		)
	}

	async function submit(): Promise<void> {
		if (!file || !client) return
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
			setMsg('Upload successful! Track is now live.')
		} catch (e) {
			setMsg('Upload failed. Please try again.')
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<div className="upload-page">
			<header className="topbar">
				<img src="/logo.jpg" alt="Melorhy" className="logo" />
				<h1 className="brand">Upload Music</h1>
				<div className="user-info">
					<span>Artist: {user}</span>
				</div>
			</header>

			<main className="upload-content">
				<div className="upload-form-container">
					<h2>Upload New Track</h2>
					<form className="upload-form" onSubmit={(e) => { e.preventDefault(); submit() }}>
						<div className="form-group">
							<label>Audio File *</label>
							<input 
								type="file" 
								accept="audio/*" 
								onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Title *</label>
							<input 
								type="text" 
								placeholder="Track title" 
								value={title} 
								onChange={(e) => setTitle(e.target.value)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Artist *</label>
							<input 
								type="text" 
								placeholder="Artist name" 
								value={artist} 
								onChange={(e) => setArtist(e.target.value)} 
								required 
							/>
						</div>

						<div className="form-group">
							<label>Album</label>
							<input 
								type="text" 
								placeholder="Album name" 
								value={album} 
								onChange={(e) => setAlbum(e.target.value)} 
							/>
						</div>

						<div className="form-group">
							<label>Artwork URL</label>
							<input 
								type="url" 
								placeholder="https://example.com/artwork.jpg" 
								value={artworkUrl} 
								onChange={(e) => setArtworkUrl(e.target.value)} 
							/>
						</div>

						<div className="form-group">
							<label>Genres</label>
							<input 
								type="text" 
								placeholder="Rock, Pop, Electronic (comma-separated)" 
								value={genres} 
								onChange={(e) => setGenres(e.target.value)} 
							/>
						</div>

						<button type="submit" disabled={!file || isBusy} className="upload-btn">
							{isBusy ? 'Uploading...' : 'Upload & Publish'}
						</button>

						{msg && (
							<div className={`message ${msg.includes('successful') ? 'success' : 'error'}`}>
								{msg}
							</div>
						)}
					</form>
				</div>
			</main>
		</div>
	)
}
